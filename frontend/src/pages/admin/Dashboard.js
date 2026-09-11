import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiUserGroup, 
  HiUsers, 
  HiCollection, 
  HiShoppingBag, 
  HiCurrencyRupee, 
  HiSparkles, 
  HiArrowRight, 
  HiRefresh,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiPlus,
  HiBell,
  HiEye,
  HiTruck,
  HiSave
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shipping Cost state for direct management right on admin dashboard
  const [shippingConfig, setShippingConfig] = useState({
    delivery_fee: 50,
    free_delivery_above: 500,
    shipping_estimated_days: '3 - 5 Business Days',
    cod_enabled: true,
    cod_min_order_value: 100,
    cod_max_order_value: 5000,
  });
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingSaving, setShippingSaving] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const { data: res } = await adminAPI.getOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingConfig = async () => {
    setShippingLoading(true);
    try {
      const { data: sData } = await adminAPI.getSettings();
      if (sData) {
        setShippingConfig({
          delivery_fee: sData.delivery_fee !== undefined ? Number(sData.delivery_fee) : 50,
          free_delivery_above: sData.free_delivery_above !== undefined ? Number(sData.free_delivery_above) : 500,
          shipping_estimated_days: sData.shipping_estimated_days || '3 - 5 Business Days',
          cod_enabled: sData.cod_enabled !== undefined ? Boolean(sData.cod_enabled) : true,
          cod_min_order_value: sData.cod_min_order_value !== undefined ? Number(sData.cod_min_order_value) : 100,
          cod_max_order_value: sData.cod_max_order_value !== undefined ? Number(sData.cod_max_order_value) : 5000,
        });
      }
    } catch (err) {
      console.error('Failed to load shipping settings on dashboard:', err);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleSaveShipping = async (e) => {
    e.preventDefault();
    setShippingSaving(true);
    try {
      await adminAPI.updateSettings({
        delivery_fee: Number(shippingConfig.delivery_fee) || 0,
        free_delivery_above: Number(shippingConfig.free_delivery_above) || 0,
        shipping_estimated_days: shippingConfig.shipping_estimated_days,
        cod_enabled: Boolean(shippingConfig.cod_enabled),
        cod_min_order_value: Number(shippingConfig.cod_min_order_value) || 0,
        cod_max_order_value: Number(shippingConfig.cod_max_order_value) || 0,
      });
      toast.success('Shipping Cost & Delivery Rules updated successfully! 🚚');
    } catch (err) {
      console.error('Failed to update shipping cost:', err);
      toast.error('Failed to save shipping cost settings');
    } finally {
      setShippingSaving(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchShippingConfig();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-dark-800 via-dark-800 to-gold-500/10 border border-dark-600 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-3">
            <span>Marketplace Control Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-400 font-sans font-semibold">
              Live Real-Time
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Complete platform oversight for Indian Artisans, Customers, Products, and AI Operations.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2 px-3 shrink-0"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary KPI Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card h-28 shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Total Artisans */}
          <div className="card p-4 flex flex-col justify-between border-l-4 border-l-gold-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Total Artisans</span>
              <div className="p-2 rounded-lg bg-gold-500/10 text-gold-400">
                <HiUserGroup className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">{data?.totalArtisans || 0}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                <span className="text-green-400 font-semibold">{data?.verifiedArtisans || 0}</span> verified
                {data?.pendingArtisans > 0 && <span className="text-yellow-400 ml-1">({data.pendingArtisans} pending)</span>}
              </p>
            </div>
          </div>

          {/* Total Customers */}
          <div className="card p-4 flex flex-col justify-between border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Customers</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <HiUsers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">{data?.totalCustomers || 0}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Registered buyers</p>
            </div>
          </div>

          {/* Total Products */}
          <div className="card p-4 flex flex-col justify-between border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Total Products</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <HiCollection className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">{data?.productStats?.total || 0}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                <span className="text-green-400">{data?.productStats?.active || 0}</span> live / <span className="text-red-400">{data?.productStats?.outOfStock || 0}</span> OOS
              </p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="card p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Total Orders</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <HiShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">{data?.orderStats?.total || 0}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                <span className="text-yellow-400">{data?.orderStats?.pending || 0} pending</span>
              </p>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="card p-4 flex flex-col justify-between border-l-4 border-l-cyan-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Revenue</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <HiCurrencyRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">₹{(data?.totalRevenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Platform GMV</p>
            </div>
          </div>

          {/* AI Catalogs */}
          <div className="card p-4 flex flex-col justify-between border-l-4 border-l-pink-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">AI Powered</span>
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <HiSparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">{data?.productStats?.aiGenerated || 0}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">AI catalogs generated</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Matrix */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: 'Add Category', path: '/admin/categories', icon: HiPlus, color: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' },
            { label: 'Pending Artisans', path: '/admin/artisans?status=pending', icon: HiUserGroup, color: 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20' },
            { label: 'Review Products', path: '/admin/products', icon: HiCollection, color: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20' },
            { label: 'Manage Orders', path: '/admin/orders', icon: HiShoppingBag, color: 'text-green-400 bg-green-500/10 hover:bg-green-500/20' },
            { label: 'Shipping Cost', path: '/admin/shipping', icon: HiTruck, color: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30' },
            { label: 'Broadcast Alert', path: '/admin/notifications', icon: HiBell, color: 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20' },
            { label: 'AI Review', path: '/admin/ai', icon: HiSparkles, color: 'text-gold-400 bg-gold-500/10 hover:bg-gold-500/20' },
          ].map((a, i) => (
            <Link
              key={i}
              to={a.path}
              className={`p-3.5 rounded-xl border border-dark-600 flex flex-col items-center justify-center text-center gap-2 transition-all group ${a.color}`}
            >
              <a.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-xs font-semibold text-white">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Shipping & Delivery Quick Management Banner */}
      <div className="card p-5 border border-gold-500/30 bg-gradient-to-r from-dark-800 via-dark-800 to-gold-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0 shadow-gold shadow-gold/5">
            <HiTruck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm">Shipping Cost & Delivery Rules</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Admin Exclusive
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-0.5">
              Set standard shipping rate (e.g. ₹50), free delivery order thresholds (e.g. Free above ₹500), and Cash on Delivery parameters.
            </p>
          </div>
        </div>
        <Link
          to="/admin/shipping"
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shrink-0 self-start md:self-auto shadow-gold"
        >
          <HiTruck className="w-4 h-4" />
          <span>Open Shipping Cost Manager →</span>
        </Link>
      </div>

      {/* Operational Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Order Status Flow</h3>
            <Link to="/admin/orders" className="text-xs text-gold-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Pending Payment / Verification', count: data?.orderStats?.pending || 0, color: 'bg-yellow-500', icon: HiClock },
              { label: 'Processing in Workshop', count: data?.orderStats?.processing || 0, color: 'bg-blue-500', icon: HiRefresh },
              { label: 'Shipped & In-Transit', count: data?.orderStats?.shipped || 0, color: 'bg-purple-500', icon: HiArrowRight },
              { label: 'Delivered to Customer', count: data?.orderStats?.delivered || 0, color: 'bg-green-500', icon: HiCheckCircle },
              { label: 'Cancelled / Returned', count: data?.orderStats?.cancelled || 0, color: 'bg-red-500', icon: HiXCircle },
            ].map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-700/50 border border-dark-600/70 text-xs">
                <div className="flex items-center gap-2.5 text-gray-300">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </div>
                <span className="font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Catalog Breakdown */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Product Inventory Health</h3>
            <Link to="/admin/products" className="text-xs text-gold-400 hover:underline">Manage</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Active Live Listings', count: data?.productStats?.active || 0, text: 'text-green-400' },
              { label: 'Pending Quality Approval', count: data?.productStats?.pending || 0, text: 'text-yellow-400' },
              { label: 'Rejected / Needs Revision', count: data?.productStats?.rejected || 0, text: 'text-red-400' },
              { label: 'Out of Stock Items', count: data?.productStats?.outOfStock || 0, text: 'text-gray-400' },
              { label: 'AI Enhanced Listings', count: data?.productStats?.aiGenerated || 0, text: 'text-gold-400' },
            ].map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-700/50 border border-dark-600/70 text-xs">
                <span className="text-gray-300">{p.label}</span>
                <span className={`font-bold ${p.text}`}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Recent Platform Activity</h3>
            <Link to="/admin/activity" className="text-xs text-gold-400 hover:underline">Full Log</Link>
          </div>
          {data?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-dark-700/40 border border-dark-600/50 text-xs">
                  <div className="p-1.5 rounded-full bg-gold-500/10 text-gold-400 shrink-0 mt-0.5">
                    <HiEye className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-gray-200 font-medium truncate">{act.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {act.time ? new Date(act.time).toLocaleString('en-IN') : 'Recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-xs">
              No recent activity recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Catalog & Orders: Dedicated Shipping Cost & Delivery Section */}
      <div className="card p-6 border border-gold-500/30 bg-gradient-to-b from-dark-800 to-dark-850 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-600 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-gold shadow-gold/5 shrink-0">
              <HiTruck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                  Catalog & Orders: Shipping Cost & Delivery Rules
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Admin Only Access
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5">
                Configure standard customer shipping fees, free delivery order thresholds, and Cash on Delivery rules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchShippingConfig}
              disabled={shippingLoading}
              className="btn-secondary text-xs py-2 px-2.5 flex items-center gap-1 text-gray-400 hover:text-white"
              title="Refresh shipping rates"
            >
              <HiRefresh className={`w-3.5 h-3.5 ${shippingLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/admin/shipping"
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 border-gold-500/30 text-gold-400 hover:text-white"
            >
              <span>Advanced Console →</span>
            </Link>
          </div>
        </div>

        {/* Live Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-dark-900/80 border border-dark-600 p-4 rounded-xl space-y-1.5">
            <p className="text-gray-400 font-semibold">Base Shipping Fee</p>
            <p className="text-gold-400 text-2xl font-bold font-serif">₹{shippingConfig.delivery_fee}</p>
            <p className="text-gray-500 text-[11px]">Applied to orders below ₹{shippingConfig.free_delivery_above}</p>
          </div>

          <div className="bg-dark-900/80 border border-emerald-500/30 p-4 rounded-xl space-y-1.5">
            <p className="text-emerald-400 font-semibold flex items-center gap-1">
              <HiCheckCircle className="w-4 h-4" /> Free Shipping Threshold
            </p>
            <p className="text-emerald-400 text-2xl font-bold font-serif">≥ ₹{shippingConfig.free_delivery_above}</p>
            <p className="text-gray-500 text-[11px]">Cart totals meeting this get 100% free delivery</p>
          </div>

          <div className="bg-dark-900/80 border border-dark-600 p-4 rounded-xl space-y-1.5">
            <p className="text-gray-400 font-semibold">Delivery Timeline & Payment</p>
            <p className="text-white text-sm font-bold truncate">{shippingConfig.shipping_estimated_days}</p>
            <p className={shippingConfig.cod_enabled ? "text-green-400 text-[11px] font-semibold" : "text-red-400 text-[11px] font-semibold"}>
              COD: {shippingConfig.cod_enabled ? `Active (₹${shippingConfig.cod_min_order_value} - ₹${shippingConfig.cod_max_order_value})` : 'Disabled'}
            </p>
          </div>
        </div>

        {/* Direct Shipping Cost Editor */}
        <form onSubmit={handleSaveShipping} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-gray-300 font-semibold">
                Base Shipping Cost (₹) <span className="text-gold-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={shippingConfig.delivery_fee}
                  onChange={(e) =>
                    setShippingConfig({
                      ...shippingConfig,
                      delivery_fee: Number(e.target.value),
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-500 rounded-xl p-2.5 pl-8 text-white font-bold text-sm focus:outline-none focus:border-gold-500"
                  required
                />
              </div>
              <span className="text-[10px] text-gray-500">Standard fee per order</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-300 font-semibold">
                Free Delivery Above (₹) <span className="text-gold-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={shippingConfig.free_delivery_above}
                  onChange={(e) =>
                    setShippingConfig({
                      ...shippingConfig,
                      free_delivery_above: Number(e.target.value),
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-500 rounded-xl p-2.5 pl-8 text-white font-bold text-sm focus:outline-none focus:border-gold-500"
                  required
                />
              </div>
              <span className="text-[10px] text-gray-500">Subtotal for zero shipping fee</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-300 font-semibold">
                Estimated Delivery Timeline <span className="text-gold-400">*</span>
              </label>
              <input
                type="text"
                value={shippingConfig.shipping_estimated_days}
                onChange={(e) =>
                  setShippingConfig({
                    ...shippingConfig,
                    shipping_estimated_days: e.target.value,
                  })
                }
                placeholder="3 - 5 Business Days"
                className="w-full bg-dark-700 border border-dark-500 rounded-xl p-2.5 text-white text-xs font-medium focus:outline-none focus:border-gold-500"
                required
              />
              <span className="text-[10px] text-gray-500">Shown to customers at checkout</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-300 font-semibold">
                Cash on Delivery (COD)
              </label>
              <div className="flex items-center justify-between p-2.5 bg-dark-700 border border-dark-500 rounded-xl">
                <span className="text-xs text-gray-300 font-medium">Allow COD</span>
                <input
                  type="checkbox"
                  checked={shippingConfig.cod_enabled}
                  onChange={(e) =>
                    setShippingConfig({
                      ...shippingConfig,
                      cod_enabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded text-gold-500 bg-dark-800 border-dark-500 cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-gray-500">Allow cash payment upon delivery</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-dark-700">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              ⚡ Only Administrators can modify shipping costs. Values apply instantly to all checkout calculations.
            </span>
            <button
              type="submit"
              disabled={shippingSaving}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 shadow-gold shrink-0 cursor-pointer"
            >
              <HiSave className="w-4 h-4" />
              <span>{shippingSaving ? 'Saving Shipping Cost...' : 'Save Shipping Cost'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
