const supabase = require('../config/supabase');
const { safeQuery } = require('../config/supabase');
const { parseArtisanUpi, formatBioWithUpi } = require('./authController');

// GET /api/artisans - all verified artisans (public)
exports.getArtisans = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase
        .from('artisan_profiles')
        .select('*, users(name, created_at)')
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false })
    );
    if (error) throw error;
    const parsed = (data || []).map(parseArtisanUpi);
    res.json(parsed);
  } catch (err) {
    console.error('getArtisans error:', err);
    res.status(500).json({ error: 'Failed to fetch artisans' });
  }
};

// GET /api/artisans/:id - public artisan store
exports.getArtisanById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: profile, error: profileError } = await supabase
      .from('artisan_profiles')
      .select('*, users(name, created_at)')
      .eq('id', id)
      .single();
    if (profileError || !profile) {
      return res.status(404).json({ error: 'Artisan not found' });
    }
    // Fetch their products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('artisan_id', id)
      .eq('is_in_stock', true)
      .order('created_at', { ascending: false });

    res.json({ profile: parseArtisanUpi(profile), products: products || [] });
  } catch (err) {
    console.error('getArtisanById error:', err);
    res.status(500).json({ error: 'Failed to fetch artisan' });
  }
};

// GET /api/artisans/me - own profile (artisan only)
exports.getMyProfile = async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('artisan_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!data) {
      const { data: newProfile, error: createErr } = await supabase
        .from('artisan_profiles')
        .insert([{
          user_id: req.user.id,
          store_name: req.user.name || 'Artisan Studio',
          artisan_type: 'Master Artisan',
          verification_status: 'pending'
        }])
        .select()
        .single();
      if (!createErr && newProfile) data = newProfile;
      else return res.status(404).json({ error: 'Artisan profile not found' });
    }
    res.json(parseArtisanUpi(data));
  } catch (err) {
    console.error('getMyProfile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PUT /api/artisans/me - update own profile
exports.updateMyProfile = async (req, res) => {
  try {
    const { store_name, artisan_type, specialization, location, bio, profile_image, preferred_language, upi_id, upi_qr_code } = req.body;
    const bioWithUpi = formatBioWithUpi(bio, upi_id, upi_qr_code);

    let { data, error } = await supabase
      .from('artisan_profiles')
      .update({ 
        store_name, 
        artisan_type, 
        specialization, 
        location, 
        bio: bioWithUpi, 
        profile_image, 
        preferred_language 
      })
      .eq('user_id', req.user.id)
      .select()
      .maybeSingle();

    if (!data) {
      const { data: newProfile, error: insError } = await supabase
        .from('artisan_profiles')
        .insert([{
          user_id: req.user.id,
          store_name: store_name || req.user.name,
          artisan_type: artisan_type || 'Master Artisan',
          specialization,
          location,
          bio: bioWithUpi,
          profile_image,
          preferred_language,
          verification_status: 'pending'
        }])
        .select()
        .single();
      if (insError) throw insError;
      data = newProfile;
    }

    const { broadcastSync } = require('../utils/realtime');
    broadcastSync('ARTISANS_UPDATED', { action: 'update', profile: data });

    res.json(parseArtisanUpi(data));
  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// GET /api/artisans/me/stats - earnings + orders summary
exports.getMyStats = async (req, res) => {
  try {
    let { data: profile } = await supabase
      .from('artisan_profiles')
      .select('id, earnings_total, verification_status, store_name')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('artisan_profiles')
        .insert([{
          user_id: req.user.id,
          store_name: req.user.name || 'Artisan Studio',
          artisan_type: 'Master Artisan',
          verification_status: 'pending'
        }])
        .select('id, earnings_total, verification_status, store_name')
        .single();
      profile = newProfile;
    }

    if (!profile) return res.status(404).json({ error: 'Artisan profile not found' });

    // Match both profile.id OR user.id to guarantee all products are retrieved
    const orCondition = `artisan_id.eq.${profile.id},artisan_id.eq.${req.user.id}`;
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, original_price, stock_quantity, is_in_stock, image_url, ai_generated, category, subcategory, status, rejection_reason, is_hidden, created_at')
      .or(orCondition)
      .order('created_at', { ascending: false });

    const productIds = (products || []).map(p => p.id);

    let recentOrders = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    if (productIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          orders(
            id,
            status,
            created_at,
            user_id,
            total_price,
            shipping_address,
            phone,
            payment_method,
            payment_status,
            users(name, email, phone)
          ),
          products(id, name, price, image_url, category)
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(100);

      recentOrders = orderItems || [];
      totalOrders = recentOrders.length;
      totalRevenue = recentOrders.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
    }

    res.json({
      verificationStatus: profile.verification_status,
      storeName: profile.store_name,
      totalProducts: (products || []).length,
      totalOrders,
      totalRevenue,
      earningsTotal: profile.earnings_total || totalRevenue,
      products: products || [],
      recentOrders
    });
  } catch (err) {
    console.error('getMyStats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/artisans/me/orders - complete customer details and delivery addresses for artisan
exports.getMyOrders = async (req, res) => {
  try {
    let { data: profile } = await supabase
      .from('artisan_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!profile) return res.json([]);

    const orCondition = `artisan_id.eq.${profile.id},artisan_id.eq.${req.user.id}`;
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .or(orCondition);

    const productIds = (products || []).map(p => p.id);
    if (productIds.length === 0) return res.json([]);

    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders(
          id,
          status,
          created_at,
          user_id,
          total_price,
          shipping_address,
          phone,
          payment_method,
          payment_status,
          users(id, name, email, phone)
        ),
        products(id, name, price, image_url, category)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orderItems || []);
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch artisan orders' });
  }
};


// PATCH /api/artisans/:id/verify - admin: set verification status
exports.verifyArtisan = async (req, res) => {
  try {
    const { verification_status } = req.body;
    const validStatuses = ['pending', 'verified', 'rejected'];
    if (!validStatuses.includes(verification_status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const { data, error } = await supabase
      .from('artisan_profiles')
      .update({ verification_status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(parseArtisanUpi(data));
  } catch (err) {
    console.error('verifyArtisan error:', err);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
};

// GET /api/artisans/admin/all - admin: all artisans regardless of status
exports.getAllArtisans = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase
        .from('artisan_profiles')
        .select('*, users(name, email, created_at)')
        .order('created_at', { ascending: false })
    );
    if (error) throw error;
    const parsed = (data || []).map(parseArtisanUpi);
    res.json(parsed);
  } catch (err) {
    console.error('getAllArtisans error:', err);
    res.status(500).json({ error: 'Failed to fetch artisans' });
  }
};
