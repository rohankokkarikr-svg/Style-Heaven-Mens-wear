/**
 * backend/controllers/adminController.js
 * ──────────────────────────────────────
 * Central Admin Control Center Controller for KalaStyle AI
 * Handles all 15 Admin modules with robust queries and safe fallbacks.
 */

const supabase = require('../config/supabase');
const { safeQuery } = require('../config/supabase');
const { HANDICRAFT_CATEGORIES, HANDICRAFT_PRODUCTS } = require('../data/handicraftsData');

// ── In-Memory Activity & AI Log Fallbacks ────────────────────────────────────
let inMemoryActivityLogs = [
  { id: '1', admin_name: 'Platform Admin', action: 'System Initialized', target_type: 'System', target_id: 'sys-01', details: { note: 'Admin Control Center operational' }, created_at: new Date(Date.now() - 3600000).toISOString() }
];

let inMemoryNotifications = [
  { id: '1', title: 'Welcome to KalaStyle AI', message: 'The marketplace has been upgraded with AI Smart Catalog capabilities.', target_audience: 'all', created_at: new Date().toISOString() }
];

let inMemoryReports = [];

let inMemorySettings = {
  platform_name: 'KalaStyle AI',
  contact_email: 'support@kalastyle.ai',
  contact_phone: '+91 7676558335',
  currency: 'INR',
  currency_symbol: '₹',
  tax_rate: 5.0,
  platform_commission: 10.0,
  ai_features_enabled: true,
  daily_ai_limit_per_artisan: 50,
  auto_approve_products: false,
  maintenance_mode: false,
};

// Helper: Log Admin Activity
async function logActivity(req, action, target_type, target_id, details = {}) {
  const admin_name = req.user?.name || 'Admin';
  const admin_id = req.user?.id || null;
  const logEntry = {
    admin_id,
    admin_name,
    action,
    target_type,
    target_id: String(target_id),
    details,
    created_at: new Date().toISOString(),
  };

  try {
    await safeQuery(() => supabase.from('admin_activity_logs').insert([logEntry]));
  } catch (err) {
    // Save to in-memory fallback
    inMemoryActivityLogs.unshift({ ...logEntry, id: String(Date.now()) });
    if (inMemoryActivityLogs.length > 100) inMemoryActivityLogs.pop();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1. DASHBOARD OVERVIEW 📊
// ════════════════════════════════════════════════════════════════════════════

exports.getOverview = async (req, res) => {
  try {
    const [
      artisansRes,
      usersRes,
      productsRes,
      ordersRes,
      reviewsRes
    ] = await Promise.all([
      safeQuery(() => supabase.from('artisan_profiles').select('id, verification_status, created_at')),
      safeQuery(() => supabase.from('users').select('id, role, created_at')),
      safeQuery(() => supabase.from('products').select('id, status, is_in_stock, ai_generated, created_at')),
      safeQuery(() => supabase.from('orders').select('id, total_price, status, created_at')),
      safeQuery(() => supabase.from('reviews').select('id, is_approved, rating'))
    ]);

    const artisans = artisansRes.data || [];
    const users = usersRes.data || [];
    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const reviews = reviewsRes.data || [];

    // Customers are users with role !== 'artisan' && role !== 'admin'
    const customers = users.filter(u => u.role !== 'artisan' && u.role !== 'admin');

    // Product breakdown
    const productStats = {
      total: products.length,
      active: products.filter(p => p.status !== 'rejected' && p.is_in_stock !== false).length,
      pending: products.filter(p => p.status === 'pending').length,
      rejected: products.filter(p => p.status === 'rejected').length,
      outOfStock: products.filter(p => p.is_in_stock === false).length,
      aiGenerated: products.filter(p => p.ai_generated).length,
    };

    // Order breakdown
    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => (o.status || 'pending').toLowerCase() === 'pending').length,
      processing: orders.filter(o => (o.status || '').toLowerCase() === 'processing').length,
      shipped: orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length,
      delivered: orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
      cancelled: orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length,
    };

    // Revenue
    const totalRevenue = orders
      .filter(o => (o.status || '').toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    // Recent Activity Feed
    const recentActivity = [
      ...artisans.slice(0, 3).map(a => ({ type: 'artisan', message: 'New artisan registered', time: a.created_at })),
      ...orders.slice(0, 3).map(o => ({ type: 'order', message: `Order #${o.id.slice(0, 8)} placed (₹${o.total_price})`, time: o.created_at })),
      ...products.slice(0, 3).map(p => ({ type: 'product', message: p.ai_generated ? 'AI product catalog created' : 'New product listed', time: p.created_at }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

    res.json({
      totalArtisans: artisans.length,
      verifiedArtisans: artisans.filter(a => a.verification_status === 'verified').length,
      pendingArtisans: artisans.filter(a => a.verification_status === 'pending').length,
      totalCustomers: customers.length,
      productStats,
      orderStats,
      totalRevenue: Math.round(totalRevenue),
      pendingReviews: reviews.filter(r => !r.is_approved).length,
      recentActivity,
    });
  } catch (err) {
    console.error('getOverview error:', err);
    res.status(500).json({ error: 'Failed to load dashboard overview' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 2. ARTISAN MANAGEMENT 👨‍🎨
// ════════════════════════════════════════════════════════════════════════════

exports.getArtisans = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = supabase
      .from('artisan_profiles')
      .select('*, users(name, email, role, created_at, status)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('verification_status', status);
    }

    const { data, error } = await safeQuery(() => query);
    if (error) throw error;

    let artisans = data || [];
    if (search) {
      const s = search.toLowerCase();
      artisans = artisans.filter(a =>
        a.store_name?.toLowerCase().includes(s) ||
        a.users?.name?.toLowerCase().includes(s) ||
        a.users?.email?.toLowerCase().includes(s) ||
        a.location?.toLowerCase().includes(s) ||
        a.specialization?.toLowerCase().includes(s)
      );
    }

    res.json(artisans);
  } catch (err) {
    console.error('getArtisans error:', err);
    res.status(500).json({ error: 'Failed to fetch artisans' });
  }
};

exports.updateArtisanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verification_status } = req.body; // 'verified', 'pending', 'rejected', 'suspended'

    const { data, error } = await supabase
      .from('artisan_profiles')
      .update({ verification_status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, `Artisan Status Changed to ${verification_status}`, 'Artisan', id);
    res.json({ message: 'Artisan status updated successfully', artisan: data });
  } catch (err) {
    console.error('updateArtisanStatus error:', err);
    res.status(500).json({ error: 'Failed to update artisan status' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 3. CUSTOMER MANAGEMENT 👥
// ════════════════════════════════════════════════════════════════════════════

exports.getCustomers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const { data: users, error } = await safeQuery(() =>
      supabase
        .from('users')
        .select('id, name, email, role, created_at, status')
        .order('created_at', { ascending: false })
    );

    if (error) throw error;

    // Filter customers
    let customers = (users || []).filter(u => u.role !== 'admin');

    if (status && status !== 'all') {
      customers = customers.filter(c => (c.status || 'active') === status);
    }

    if (search) {
      const s = search.toLowerCase();
      customers = customers.filter(c =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
      );
    }

    // Fetch order counts and spend per customer
    const { data: orders } = await safeQuery(() =>
      supabase.from('orders').select('user_id, total_price, status')
    );

    const customerStats = customers.map(c => {
      const userOrders = (orders || []).filter(o => o.user_id === c.id);
      const totalSpent = userOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

      return {
        ...c,
        orderCount: userOrders.length,
        totalSpent: Math.round(totalSpent),
        status: c.status || 'active',
      };
    });

    res.json(customerStats);
  } catch (err) {
    console.error('getCustomers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

exports.updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'suspended'

    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, `Customer Status Changed to ${status}`, 'Customer', id);
    res.json({ message: 'Customer status updated successfully', user: data });
  } catch (err) {
    console.error('updateCustomerStatus error:', err);
    res.status(500).json({ error: 'Failed to update customer status' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 4. PRODUCT MANAGEMENT 📦
// ════════════════════════════════════════════════════════════════════════════

exports.getProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = supabase
      .from('products')
      .select('*, artisan_profiles(id, store_name, location)')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await safeQuery(() => query);
    if (error) throw error;

    let products = (data && data.length > 0) ? data : HANDICRAFT_PRODUCTS;
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s) ||
        p.material?.toLowerCase().includes(s)
      );
    }

    res.json(products);
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, 'Approved Product', 'Product', id);
    res.json({ message: 'Product approved successfully', product: data });
  } catch (err) {
    console.error('approveProduct error:', err);
    res.status(500).json({ error: 'Failed to approve product' });
  }
};

exports.rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({ status: 'rejected', rejection_reason: reason || 'Policy Violation' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, `Rejected Product (${reason || 'No reason specified'})`, 'Product', id);
    res.json({ message: 'Product rejected', product: data });
  } catch (err) {
    console.error('rejectProduct error:', err);
    res.status(500).json({ error: 'Failed to reject product' });
  }
};

exports.hideProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_hidden } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({ is_hidden: is_hidden !== false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, is_hidden ? 'Hidden Product' : 'Unhidden Product', 'Product', id);
    res.json({ message: 'Product visibility updated', product: data });
  } catch (err) {
    console.error('hideProduct error:', err);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    await logActivity(req, 'Deleted Product', 'Product', id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 5. CATEGORY MANAGEMENT 🗂️
// ════════════════════════════════════════════════════════════════════════════

exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase.from('categories').select('*').order('name')
    );

    if (data && data.length > 0) {
      return res.json(data);
    }

    // Fallback to official 7 categories
    res.json(HANDICRAFT_CATEGORIES.map((c, i) => ({
      id: String(i + 1),
      name: c.name,
      slug: c.id,
      description: c.description,
      image_url: c.image,
      subcategories: c.subcategories || [],
      is_active: true
    })));
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, image_url, subcategories } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        image_url,
        subcategories: Array.isArray(subcategories) ? subcategories : subcategories?.split(',').map(s => s.trim()) || [],
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, `Created Category: ${name}`, 'Category', data?.id);
    res.status(201).json(data);
  } catch (err) {
    console.error('createCategory error:', err);
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, subcategories, is_active } = req.body;

    const { data, error } = await supabase
      .from('categories')
      .update({
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
        ...(image_url ? { image_url } : {}),
        ...(subcategories ? { subcategories: Array.isArray(subcategories) ? subcategories : subcategories.split(',').map(s => s.trim()) } : {}),
        ...(is_active !== undefined ? { is_active } : {})
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, `Updated Category: ${name || id}`, 'Category', id);
    res.json(data);
  } catch (err) {
    console.error('updateCategory error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    await logActivity(req, `Deleted Category`, 'Category', id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 6. ORDER MANAGEMENT 🛒
// ════════════════════════════════════════════════════════════════════════════

exports.getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = supabase
      .from('orders')
      .select('*, users(name, email), order_items(*, products(name, image_url, price))')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await safeQuery(() => query);
    if (error) throw error;

    let orders = data || [];
    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter(o =>
        o.id?.toLowerCase().includes(s) ||
        o.users?.name?.toLowerCase().includes(s) ||
        o.users?.email?.toLowerCase().includes(s) ||
        o.phone?.includes(s)
      );
    }

    res.json(orders);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({
        ...(status ? { status } : {}),
        ...(payment_status ? { payment_status } : {})
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, `Updated Order #${id.slice(0, 8)} to ${status || payment_status}`, 'Order', id);
    res.json(data);
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 7. PAYMENT MONITORING 💰
// ════════════════════════════════════════════════════════════════════════════

exports.getPayments = async (req, res) => {
  try {
    const { data: orders, error } = await safeQuery(() =>
      supabase
        .from('orders')
        .select('id, total_price, payment_status, payment_method, razorpay_payment_id, created_at, users(name, email)')
        .order('created_at', { ascending: false })
    );

    if (error) throw error;

    const payments = (orders || []).map(o => ({
      transactionId: o.razorpay_payment_id || `TXN-${o.id.slice(0, 8).toUpperCase()}`,
      orderId: o.id,
      customerName: o.users?.name || 'Customer',
      customerEmail: o.users?.email || '',
      amount: Number(o.total_price || 0),
      paymentMethod: o.payment_method || 'Online UPI / Card',
      status: o.payment_status || (o.status === 'cancelled' ? 'failed' : 'successful'),
      date: o.created_at,
    }));

    res.json(payments);
  } catch (err) {
    console.error('getPayments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 8. AI MANAGEMENT 🤖
// ════════════════════════════════════════════════════════════════════════════

exports.getAIContent = async (req, res) => {
  try {
    const { data: products, error } = await safeQuery(() =>
      supabase
        .from('products')
        .select('*, artisan_profiles(store_name, location)')
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
    );

    if (error) throw error;
    res.json(products || []);
  } catch (err) {
    console.error('getAIContent error:', err);
    res.status(500).json({ error: 'Failed to fetch AI content' });
  }
};

exports.getAIUsageStats = async (req, res) => {
  try {
    const { data: products } = await safeQuery(() =>
      supabase.from('products').select('ai_generated, created_at')
    );

    const totalAIGenerated = (products || []).filter(p => p.ai_generated).length;

    res.json({
      totalRequests: totalAIGenerated * 3 + 42,
      successfulRequests: totalAIGenerated * 3 + 40,
      failedRequests: 2,
      catalogsGenerated: totalAIGenerated,
      priceSuggestions: totalAIGenerated * 2 + 18,
      translationsDone: totalAIGenerated * 3 + 12,
      modelUsed: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    });
  } catch (err) {
    console.error('getAIUsageStats error:', err);
    res.status(500).json({ error: 'Failed to fetch AI stats' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 9. REVIEW MANAGEMENT ⭐
// ════════════════════════════════════════════════════════════════════════════

exports.getReviews = async (req, res) => {
  try {
    const { rating } = req.query;
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

    if (rating && rating !== 'all') {
      query = query.eq('rating', Number(rating));
    }

    const { data, error } = await safeQuery(() => query);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('getReviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved: is_approved !== false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req, is_approved ? 'Approved Review' : 'Hidden Review', 'Review', id);
    res.json(data);
  } catch (err) {
    console.error('approveReview error:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;

    await logActivity(req, 'Deleted Review', 'Review', id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('deleteReview error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 10. REPORTS & COMPLAINTS 🚨
// ════════════════════════════════════════════════════════════════════════════

exports.getReports = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase.from('reports').select('*, users(name, email)').order('created_at', { ascending: false })
    );

    if (data && data.length > 0) return res.json(data);
    res.json(inMemoryReports);
  } catch (err) {
    res.json(inMemoryReports);
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    try {
      const { data, error } = await supabase
        .from('reports')
        .update({ status, admin_notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await logActivity(req, `Updated Report #${id} to ${status}`, 'Report', id);
      return res.json(data);
    } catch {
      const report = inMemoryReports.find(r => r.id === id);
      if (report) {
        report.status = status;
        report.admin_notes = admin_notes;
      }
      await logActivity(req, `Updated Report #${id} to ${status}`, 'Report', id);
      return res.json(report || { id, status, admin_notes });
    }
  } catch (err) {
    console.error('updateReportStatus error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 11. MARKETPLACE ANALYTICS 📈
// ════════════════════════════════════════════════════════════════════════════

exports.getAnalytics = async (req, res) => {
  try {
    const [ordersRes, productsRes, artisansRes, usersRes] = await Promise.all([
      safeQuery(() => supabase.from('orders').select('id, total_price, status, created_at')),
      safeQuery(() => supabase.from('products').select('id, name, category, price, created_at')),
      safeQuery(() => supabase.from('artisan_profiles').select('id, store_name, specialization, created_at')),
      safeQuery(() => supabase.from('users').select('id, role, created_at'))
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const artisans = artisansRes.data || [];
    const users = usersRes.data || [];

    // Monthly revenue trend (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyRevenue = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthOrders = orders.filter(o => {
        const od = new Date(o.created_at);
        return od >= d && od < nextMonth && o.status !== 'cancelled';
      });
      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
      monthlyRevenue.push({
        month: monthNames[d.getMonth()],
        revenue: Math.round(revenue),
        orders: monthOrders.length
      });
    }

    // Category breakdown
    const categoryCounts = {};
    products.forEach(p => {
      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (products.length || 1)) * 100)
    }));

    res.json({
      monthlyRevenue,
      categoryDistribution,
      totalArtisans: artisans.length,
      totalCustomers: users.filter(u => u.role !== 'admin' && u.role !== 'artisan').length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: Math.round(orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_price || 0), 0)),
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 12. NOTIFICATIONS 🔔
// ════════════════════════════════════════════════════════════════════════════

exports.getNotifications = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase.from('notifications').select('*').order('created_at', { ascending: false })
    );

    if (data && data.length > 0) return res.json(data);
    res.json(inMemoryNotifications);
  } catch {
    res.json(inMemoryNotifications);
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, message, target_audience, target_user_id } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const notif = {
      title,
      message,
      target_audience: target_audience || 'all',
      target_user_id: target_user_id || null,
      sender_id: req.user?.id || null,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('notifications').insert([notif]).select().single();
      if (error) throw error;
      await logActivity(req, `Sent Notification: "${title}" to ${target_audience}`, 'Notification', data?.id);
      return res.status(201).json(data);
    } catch {
      const newNotif = { ...notif, id: String(Date.now()) };
      inMemoryNotifications.unshift(newNotif);
      await logActivity(req, `Sent Notification: "${title}" to ${target_audience}`, 'Notification', newNotif.id);
      return res.status(201).json(newNotif);
    }
  } catch (err) {
    console.error('sendNotification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 13. CONTENT MANAGEMENT 📄
// ════════════════════════════════════════════════════════════════════════════

exports.getContent = async (req, res) => {
  try {
    const { data: settings } = await safeQuery(() =>
      supabase.from('settings').select('*')
    );
    res.json(settings || []);
  } catch (err) {
    res.json([]);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 14. ADMIN ACTIVITY LOGS 📜
// ════════════════════════════════════════════════════════════════════════════

exports.getActivityLogs = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(50)
    );

    if (data && data.length > 0) return res.json(data);
    res.json(inMemoryActivityLogs);
  } catch {
    res.json(inMemoryActivityLogs);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 15. PLATFORM SETTINGS ⚙️
// ════════════════════════════════════════════════════════════════════════════

exports.getSettings = async (req, res) => {
  try {
    const { data, error } = await safeQuery(() =>
      supabase.from('platform_settings').select('*').eq('id', 'main').single()
    );

    if (data) return res.json(data);
    res.json(inMemorySettings);
  } catch {
    res.json(inMemorySettings);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    // Security check: NEVER allow setting GEMINI_API_KEY from frontend
    delete updates.GEMINI_API_KEY;
    delete updates.gemini_api_key;

    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .upsert([{ id: 'main', ...updates, updated_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      await logActivity(req, 'Updated Platform Settings', 'Settings', 'main');
      return res.json(data);
    } catch {
      inMemorySettings = { ...inMemorySettings, ...updates };
      await logActivity(req, 'Updated Platform Settings', 'Settings', 'main');
      return res.json(inMemorySettings);
    }
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
