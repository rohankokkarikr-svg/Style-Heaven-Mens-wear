const { safeQuery } = require('../config/supabase');
const supabase = require('../config/supabase');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
    const startOf7Days = new Date(now); startOf7Days.setDate(now.getDate() - 6); startOf7Days.setHours(0,0,0,0);
    const startOf30Days = new Date(now); startOf30Days.setDate(now.getDate() - 29); startOf30Days.setHours(0,0,0,0);
    const startOfPrev30 = new Date(startOf30Days); startOfPrev30.setDate(startOfPrev30.getDate() - 30);

    // ── Run all queries in parallel with safety wrapper ──────────────────────────
    const [
      allOrdersRes,
      productsRes,
      reviewsRes,
      orderItemsRes,
      recentOrdersRes,
    ] = await Promise.all([
      // All non-cancelled orders with created_at
      safeQuery(() => supabase.from('orders').select('id, total_price, status, created_at, discount_amount').neq('status', 'cancelled')),

      // Product count + category breakdown
      safeQuery(() => supabase.from('products').select('id, name, category, price, created_at, stock_quantity, is_in_stock')),

      // Pending review count
      safeQuery(() => supabase.from('reviews').select('id, is_approved')),

      // Order items with product info for top products
      safeQuery(() => supabase.from('order_items').select('product_id, quantity, price_at_time, products(name, category)')),

      // Recent 5 orders with user info
      safeQuery(() => supabase.from('orders')
        .select('id, total_price, status, created_at, users(name, email)')
        .order('created_at', { ascending: false })
        .limit(5)),
    ]);


    if (allOrdersRes.error) throw allOrdersRes.error;
    if (productsRes.error) throw productsRes.error;

    const allOrders = allOrdersRes.data || [];
    const products = productsRes.data || [];
    const orderItems = orderItemsRes.data || [];
    const recentOrders = recentOrdersRes.data || [];

    // ── KPI Calculations ─────────────────────────────────────────────────────
    const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);
    const totalOrders  = allOrders.length;
    const totalProducts = products.length;

    // Today's revenue
    const todayOrders = allOrders.filter(o => new Date(o.created_at) >= startOfToday);
    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    // Last 30 days revenue
    const last30Orders = allOrders.filter(o => new Date(o.created_at) >= startOf30Days);
    const last30Revenue = last30Orders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    // Previous 30 days revenue (for % change)
    const prev30Orders = allOrders.filter(o => {
      const d = new Date(o.created_at);
      return d >= startOfPrev30 && d < startOf30Days;
    });
    const prev30Revenue = prev30Orders.reduce((s, o) => s + Number(o.total_price || 0), 0);
    const revenueChange = prev30Revenue > 0
      ? (((last30Revenue - prev30Revenue) / prev30Revenue) * 100).toFixed(1)
      : last30Revenue > 0 ? 100 : 0;

    // Order status breakdown
    const allOrdersWithCancelled = (allOrdersRes.data || []);
    const statusCounts = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
    allOrdersWithCancelled.forEach(o => {
      const s = (o.status || 'pending').toLowerCase();
      if (statusCounts[s] !== undefined) statusCounts[s]++;
    });

    // Pending reviews
    const pendingReviews = (reviewsRes.data || []).filter(r => !r.is_approved).length;

    // Conversion rate: orders / (total products as proxy for catalogue views, min mock)
    const conversionRate = totalProducts > 0
      ? ((totalOrders / Math.max(totalProducts * 10, totalOrders)) * 100).toFixed(1)
      : '0.0';

    // Average order value
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;

    // Discount savings total
    const totalDiscounts = allOrders.reduce((s, o) => s + Number(o.discount_amount || 0), 0);

    // ── Revenue chart — last 7 days ──────────────────────────────────────────
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const revenueData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0,0,0,0);
      const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1);
      const dayRevenue = allOrders
        .filter(o => { const d = new Date(o.created_at); return d >= day && d < nextDay; })
        .reduce((s, o) => s + Number(o.total_price || 0), 0);
      const dayOrderCount = allOrders
        .filter(o => { const d = new Date(o.created_at); return d >= day && d < nextDay; }).length;
      revenueData.push({
        name: dayNames[day.getDay()],
        date: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        amount: Math.round(dayRevenue),
        orders: dayOrderCount,
      });
    }

    // ── Sales by category (from order items) ────────────────────────────────
    const categoryMap = {};
    orderItems.forEach(item => {
      const cat = item.products?.category || 'Other';
      const capitalised = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!categoryMap[capitalised]) categoryMap[capitalised] = { count: 0, revenue: 0 };
      categoryMap[capitalised].count  += Number(item.quantity || 1);
      categoryMap[capitalised].revenue += Number(item.price_at_time || 0) * Number(item.quantity || 1);
    });
    const salesData = Object.entries(categoryMap)
      .map(([name, v]) => ({ name, count: v.count, revenue: Math.round(v.revenue) }))
      .sort((a, b) => b.count - a.count);

    // Fallback if no order items
    if (salesData.length === 0) {
      const catCounts = {};
      products.forEach(p => {
        const cat = (p.category || 'Other');
        const cap = cat.charAt(0).toUpperCase() + cat.slice(1);
        catCounts[cap] = (catCounts[cap] || 0) + 1;
      });
      Object.entries(catCounts).forEach(([name, count]) =>
        salesData.push({ name, count, revenue: 0 })
      );
    }

    // ── Top products by quantity sold ────────────────────────────────────────
    const productSalesMap = {};
    orderItems.forEach(item => {
      const name = item.products?.name || 'Unknown';
      if (!productSalesMap[name]) productSalesMap[name] = { name, qty: 0, revenue: 0 };
      productSalesMap[name].qty     += Number(item.quantity || 1);
      productSalesMap[name].revenue += Number(item.price_at_time || 0) * Number(item.quantity || 1);
    });
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map(p => ({ ...p, revenue: Math.round(p.revenue) }));

    // ── Inventory / Stock Calculations ───────────────────────────────────────
    const outOfStock = [];
    const lowStock = [];
    
    products.forEach(p => {
      const currentStock = p.stock_quantity !== undefined ? p.stock_quantity : 0;
      
      if (currentStock === 0 || p.is_in_stock === false) {
        outOfStock.push({ name: p.name, stock: 0 });
      } else if (currentStock < 5) {
        lowStock.push({ name: p.name, stock: currentStock });
      }
    });

    // Sort low stock by lowest first
    lowStock.sort((a, b) => a.stock - b.stock);

    // ── Monthly revenue (last 6 months) ─────────────────────────────────────
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthRevenue = allOrders
        .filter(o => { const od = new Date(o.created_at); return od >= d && od < nextMonth; })
        .reduce((s, o) => s + Number(o.total_price || 0), 0);
      const monthOrderCount = allOrders
        .filter(o => { const od = new Date(o.created_at); return od >= d && od < nextMonth; }).length;
      monthlyData.push({
        name: monthNames[d.getMonth()],
        amount: Math.round(monthRevenue),
        orders: monthOrderCount,
      });
    }

    // ── Format recent orders ─────────────────────────────────────────────────
    const recentOrdersFmt = recentOrders.map(o => ({
      id: o.id,
      shortId: o.id?.substring(0,8),
      customerName: o.users?.name || 'Guest',
      customerEmail: o.users?.email || '',
      total: Number(o.total_price || 0),
      status: o.status || 'pending',
      createdAt: o.created_at,
    }));

    res.json({
      // KPIs
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalProducts,
      conversionRate,
      avgOrderValue: Number(avgOrderValue),
      todayRevenue: Math.round(todayRevenue),
      todayOrders: todayOrders.length,
      last30Revenue: Math.round(last30Revenue),
      revenueChange: Number(revenueChange),
      totalDiscounts: Math.round(totalDiscounts),
      pendingReviews,
      // Status
      orderStatusCounts: statusCounts,
      // Charts
      revenueData,
      monthlyData,
      salesData,
      topProducts,
      outOfStock: outOfStock.slice(0, 5),
      lowStock: lowStock.slice(0, 5),
      recentOrders: recentOrdersFmt,
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
