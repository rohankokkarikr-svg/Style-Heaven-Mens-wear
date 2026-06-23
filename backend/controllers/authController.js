const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    // Check if user exists (we store phone number in the email column)
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', phone)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store the phone in the email column under the hood
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ name, email: phone, password: hashedPassword, role: 'user' }])
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(user.id);
    
    // Remove password from response
    delete user.password;

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Please provide phone and password' });
    }

    // Find user by phone (stored in the email column)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', phone)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    
    delete user.password;

    res.json({
      user,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = { ...req.user };
    delete user.password;
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    const REWARD_THRESHOLD = 10; // 10 items ordered (any category) = 1 free T-shirt (one-time welcome reward)

    // 1. Fetch ALL orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_price, status, created_at')
      .eq('user_id', userId);

    if (ordersError) throw ordersError;

    // Filter to only delivered orders for rewards progress
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const deliveredOrderIds = deliveredOrders.map(o => o.id);
    let totalItemsOrdered = 0;
    let totalSpent = 0;

    if (deliveredOrderIds.length > 0) {
      // 2. Count items only from delivered orders
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('quantity')
        .in('order_id', deliveredOrderIds);

      if (itemsError) throw itemsError;

      items.forEach(item => {
        totalItemsOrdered += (item.quantity || 1);
      });

      // Total spent only from delivered orders (for membership level)
      totalSpent = deliveredOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    }

    // 3. Reward milestone: 10 items delivered = 1 free T-shirt (one-time cap)
    const progress         = Math.min(totalItemsOrdered, REWARD_THRESHOLD);
    const rewardsEarned    = totalItemsOrdered >= REWARD_THRESHOLD ? 1 : 0;
    const needed           = REWARD_THRESHOLD - progress;

    // 4. Auto-provision unique reward coupon if milestone reached
    let rewardCode = null;
    let rewardClaimed = false; // true once the coupon has been used at checkout
    let couponCreatedAt = null;

    if (rewardsEarned > 0) {
      // Check if user already has a FREESHIRT10 coupon code in database
      const { data: existingCoupons, error: couponFindError } = await supabase
        .from('coupons')
        .select('code, is_used, created_at')
        .eq('user_id', userId)
        .like('code', 'FREESHIRT10%');

      if (couponFindError) {
        console.error('Error finding existing coupon:', couponFindError);
      }

      if (!existingCoupons || existingCoupons.length === 0) {
        // First time reaching the milestone — generate a unique code and provision the coupon
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        rewardCode = `FREESHIRT10-${randomStr}`;

        const { data: newCoupon, error: couponInsertError } = await supabase
          .from('coupons')
          .insert({
            code: rewardCode,
            discount_type: 'percentage',
            discount_value: 100,
            user_id: userId,
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_used: false
          })
          .select()
          .single();

        if (couponInsertError) {
          console.error('Error inserting coupon:', couponInsertError);
        } else if (newCoupon) {
          couponCreatedAt = newCoupon.created_at;
        }
        rewardClaimed = false;
      } else {
        // Coupon exists
        rewardCode = existingCoupons[0].code;
        rewardClaimed = existingCoupons[0].is_used === true;
        couponCreatedAt = existingCoupons[0].created_at;
      }
    }

    // 5. Membership Level (based on total amount spent on delivered orders)
    let level = 'Bronze';
    if (totalSpent > 50000)      level = 'Elite';
    else if (totalSpent > 35000) level = 'Diamond';
    else if (totalSpent > 20000) level = 'Gold';
    else if (totalSpent > 5000)  level = 'Silver';

    res.json({
      totalItemsOrdered,
      progress,
      needed,
      rewardsEarned,
      rewardClaimed,          // <-- lets frontend know if the coupon was already used
      totalSpent,
      membershipLevel: level,
      points: Math.floor(totalSpent / 10),
      rewardThreshold: REWARD_THRESHOLD,
      history: [
        { id: 1, title: 'Welcome Reward', date: '2026-05-01', status: 'Redeemed', code: 'WELCOME10' },
        ...(rewardsEarned > 0
          ? [{
              id: 2,
              title: `Free T-Shirt Unlocked — ${REWARD_THRESHOLD} items delivered!`,
              date: couponCreatedAt ? couponCreatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
              // Reflect actual DB status: Redeemed if coupon is used, else Available
              status: rewardClaimed ? 'Redeemed' : 'Available',
              code: rewardCode
            }]
          : []
        )
      ]
    });

  } catch (error) {
    console.error('Rewards error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards data' });
  }
};

