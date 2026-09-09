import React, { useEffect, useState } from 'react';
import { artisanAPI } from '../../services/api';
import { 
  HiLocationMarker, 
  HiPhone, 
  HiMail, 
  HiClipboardCopy, 
  HiRefresh, 
  HiSearch, 
  HiShoppingBag, 
  HiTruck,
  HiCheckCircle,
  HiClock
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ArtisanOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Try dedicated orders endpoint first, fallback to getMyStats
      const res = await artisanAPI.getMyOrders();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setOrders(res.data);
      } else {
        const statsRes = await artisanAPI.getMyStats();
        setOrders(statsRes?.data?.recentOrders || []);
      }
    } catch {
      try {
        const statsRes = await artisanAPI.getMyStats();
        setOrders(statsRes?.data?.recentOrders || []);
      } catch (err) {
        console.error('Failed to load artisan orders:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time listener: instantly reflect when a customer places an order
  useEffect(() => {
    const handleSync = (e) => {
      fetchOrders();
      toast.success('🔔 New customer order received! Details updated.');
    };
    window.addEventListener('kala:sync:orders_updated', handleSync);
    return () => window.removeEventListener('kala:sync:orders_updated', handleSync);
  }, []);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`📋 ${label} copied to clipboard!`);
  };

  const STATUS_CONFIG = {
    pending:    { label: 'Pending Packing', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: HiClock },
    processing: { label: 'In Preparation',  bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',   icon: HiShoppingBag },
    shipped:    { label: 'Out for Delivery',bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: HiTruck },
    delivered:  { label: 'Delivered',       bg: 'bg-green-500/20 text-green-400 border-green-500/40', icon: HiCheckCircle },
    cancelled:  { label: 'Cancelled',       bg: 'bg-red-500/20 text-red-400 border-red-500/40',     icon: HiClock },
  };

  const filteredOrders = orders.filter(item => {
    const status = item.orders?.status || 'pending';
    if (filter !== 'all' && status !== filter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const customerName = (item.orders?.users?.name || '').toLowerCase();
      const customerPhone = (item.orders?.phone || item.orders?.users?.phone || '').toLowerCase();
      const productName = (item.products?.name || '').toLowerCase();
      const address = (item.orders?.shipping_address || '').toLowerCase();
      const orderId = (item.orders?.id || '').toLowerCase();

      return (
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        productName.includes(q) ||
        address.includes(q) ||
        orderId.includes(q)
      );
    }
    return true;
  });

  const totalRevenue = orders.reduce((sum, item) => sum + ((item.price_at_time || 0) * (item.quantity || 1)), 0);
  const pendingCount = orders.filter(o => !o.orders?.status || o.orders?.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">Artisan Orders & Shipping Details</h1>
          <p className="text-gray-400 text-sm mt-1">
            View complete customer information, delivery addresses, and products to dispatch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3">
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border border-dark-700 bg-dark-800/80">
          <p className="text-xs text-gray-400 uppercase font-semibold">Total Orders</p>
          <p className="text-2xl font-bold text-white mt-1">{orders.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Orders with your crafts</p>
        </div>
        <div className="card p-4 border border-yellow-500/30 bg-yellow-500/5">
          <p className="text-xs text-yellow-400 uppercase font-semibold">Orders to Pack</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">Pending dispatch</p>
        </div>
        <div className="card p-4 border border-gold-500/30 bg-gold-500/5">
          <p className="text-xs text-gold-400 uppercase font-semibold">Total Payout Value</p>
          <p className="text-2xl font-bold text-gold-400 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-400 mt-1">Your item sales earnings</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 space-y-3 border border-dark-700 bg-dark-800">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'processing', label: 'Processing' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'delivered', label: 'Delivered' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                  filter === tab.id
                    ? 'bg-gold-500/20 text-gold-400 font-semibold border-gold-500/40'
                    : 'text-gray-400 hover:text-white border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <HiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, phone, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-gold-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Order List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-48 shimmer rounded-xl" />)}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((item, idx) => {
            const orderObj = item.orders || {};
            const customerObj = orderObj.users || {};
            const customerName = customerObj.name || 'Customer';
            const customerPhone = orderObj.phone || customerObj.phone || '';
            const customerEmail = customerObj.email || '';
            const shippingAddress = orderObj.shipping_address || 'Address provided at checkout';
            const statusKey = orderObj.status || 'pending';
            const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            const fullShippingText = `Recipient: ${customerName}\nPhone: ${customerPhone}\nAddress:\n${shippingAddress}\nProduct: ${item.products?.name || 'Craft'} (Qty: ${item.quantity || 1}, Size: ${item.size || 'Free Size'})`;

            return (
              <div key={item.id || idx} className="card p-5 border border-dark-600/80 hover:border-gold-500/40 transition-all bg-dark-800/95 space-y-4">
                {/* Header: Order ID, Status, Date */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dark-700">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-md border border-gold-500/30">
                      #{String(orderObj.id || idx).substring(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.bg}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                    {orderObj.payment_method && (
                      <span className="text-[10px] font-medium text-gray-300 bg-dark-700 px-2 py-0.5 rounded border border-dark-600">
                        💳 {orderObj.payment_method.toUpperCase()} {orderObj.payment_status === 'completed' ? '• Paid' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Ordered on: {orderObj.created_at ? new Date(orderObj.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Product Info (5 cols) */}
                  <div className="lg:col-span-5 flex gap-3.5 items-start">
                    {item.products?.image_url ? (
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-20 h-20 object-cover rounded-lg border border-dark-600 shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-dark-700 flex items-center justify-center text-2xl border border-dark-600 shrink-0">
                        🎨
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm line-clamp-1">{item.products?.name || 'Handcrafted Product'}</h4>
                      <p className="text-gray-400 text-xs mt-0.5">{item.products?.category || 'Indian Handicrafts'}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-gray-300">
                          Qty: <strong className="text-white">{item.quantity || 1}</strong>
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-300">
                          Size: <strong className="text-gold-400">{item.size || 'Free Size'}</strong>
                        </span>
                      </div>

                      <div className="mt-2 text-sm">
                        <span className="text-xs text-gray-400 mr-1">Your Item Amount:</span>
                        <span className="font-bold text-gold-400 text-base">
                          ₹{((item.price_at_time || item.products?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Customer Details (3 cols) */}
                  <div className="lg:col-span-3 p-3.5 rounded-xl bg-dark-900/60 border border-dark-700/80 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                        👤 Customer Details
                      </p>
                      <p className="font-bold text-white text-sm">{customerName}</p>
                      
                      {customerPhone && (
                        <p className="text-xs text-gray-300 mt-1 flex items-center gap-1 font-mono">
                          <HiPhone className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                          +91 {customerPhone}
                        </p>
                      )}

                      {customerEmail && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate">
                          <HiMail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          {customerEmail}
                        </p>
                      )}
                    </div>

                    {/* Quick WhatsApp contact */}
                    {customerPhone && (
                      <div className="mt-3 pt-2.5 border-t border-dark-700/60">
                        <a
                          href={`https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(customerName)},%20this%20is%20regarding%20your%20order%20%23${encodeURIComponent(orderObj.id?.substring(0, 8))}%20for%20"${encodeURIComponent(item.products?.name || 'craft item')}".%20We%20are%20preparing%20it%20for%20dispatch!`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium py-1 px-2 rounded bg-green-500/10 border border-green-500/20"
                        >
                          <FaWhatsapp className="w-3.5 h-3.5" /> Chat on WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Complete Delivery Address (4 cols) */}
                  <div className="lg:col-span-4 p-3.5 rounded-xl bg-dark-900/60 border border-dark-700/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1">
                          <HiLocationMarker className="w-3.5 h-3.5 text-gold-400" /> Delivery Address
                        </p>
                        <button
                          onClick={() => copyToClipboard(fullShippingText, 'Full shipping label')}
                          className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 bg-dark-800 px-2 py-0.5 rounded border border-dark-600"
                          title="Copy shipping label"
                        >
                          <HiClipboardCopy className="w-3 h-3 text-gold-400" /> Copy Label
                        </button>
                      </div>

                      <div className="text-xs text-gray-200 leading-relaxed font-sans bg-dark-950/60 p-2.5 rounded-lg border border-dark-800 select-all">
                        {shippingAddress}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Recipient: <strong className="text-white">{customerName}</strong></span>
                      <button
                        onClick={() => copyToClipboard(shippingAddress, 'Address')}
                        className="text-gold-400 hover:underline flex items-center gap-0.5"
                      >
                        Copy Address Only
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center border border-dark-700">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="text-lg font-semibold text-white mb-1">No orders found</h3>
          <p className="text-gray-400 text-xs max-w-md mx-auto">
            {search ? `No orders matched "${search}".` : 'When customers purchase your handcrafted creations, their complete details and delivery addresses will appear here automatically!'}
          </p>
        </div>
      )}
    </div>
  );
}

