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
    const { data, error } = await supabase
      .from('artisan_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Artisan profile not found' });
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

    const { data, error } = await supabase
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
      .single();
    if (error) throw error;
    res.json(parseArtisanUpi(data));
  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// GET /api/artisans/me/stats - earnings + orders summary
exports.getMyStats = async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('artisan_profiles')
      .select('id, earnings_total')
      .eq('user_id', req.user.id)
      .single();

    if (!profile) return res.status(404).json({ error: 'Artisan profile not found' });

    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_in_stock, image_url, ai_generated, category, created_at')
      .eq('artisan_id', profile.id)
      .order('created_at', { ascending: false });

    const productIds = (products || []).map(p => p.id);

    let recentOrders = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    if (productIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*, orders(id, status, created_at, user_id), products(name, price)')
        .in('product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(10);

      recentOrders = orderItems || [];
      totalOrders = recentOrders.length;
      totalRevenue = recentOrders.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
    }

    res.json({
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
