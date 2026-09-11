import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiCheckCircle, HiClock, HiExclamationCircle, HiTruck,
  HiLocationMarker, HiShoppingBag, HiArrowLeft, HiRefresh
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const ARTISAN_STEPS = [
  { key: 'pending',           label: 'Order Received',     icon: '📦' },
  { key: 'accepted',          label: 'Accepted by Artisan', icon: '✅' },
  { key: 'preparing',         label: 'Preparing',           icon: '🎨' },
  { key: 'ready_for_pickup',  label: 'Ready for Pickup',    icon: '📬' },
  { key: 'dispatched',        label: 'Dispatched',          icon: '🚚' },
  { key: 'out_for_delivery',  label: 'Out for Delivery',    icon: '🛵' },
  { key: 'delivered',         label: 'Delivered',           icon: '🎉' },
];

const STATUS_ORDER = ARTISAN_STEPS.map(s => s.key);

function getStepIndex(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function StatusBadge({ status }) {
  const map = {
    pending:          { label: 'Pending',           color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
    accepted:         { label: 'Accepted',           color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
    preparing:        { label: 'Preparing',          color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
    ready_for_pickup: { label: 'Ready for Pickup',   color: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
    dispatched:       { label: 'Dispatched',         color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
    out_for_delivery: { label: 'Out for Delivery',   color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    delivered:        { label: 'Delivered ✓',        color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
    cancelled:        { label: 'Cancelled',          color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
    rejected:         { label: 'Rejected',           color: 'bg-red-600/20 text-red-400 border border-red-600/30' },
    cod_pending:      { label: 'Pay on Delivery',    color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
    paid:             { label: 'Paid ✓',             color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
    refunded:         { label: 'Refunded',           color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  };
  const cfg = map[status] || { label: status, color: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
  );
}

function ArtisanTimeline({ artisanOrder }) {
  const currentIdx = getStepIndex(artisanOrder.status);
  const isCancelled = ['cancelled', 'rejected'].includes(artisanOrder.status);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-dark-600/60" />
      <div className="space-y-3">
        {ARTISAN_STEPS.map((step, idx) => {
          const isDone = idx <= currentIdx && !isCancelled;
          const isCurrent = idx === currentIdx && !isCancelled;
          return (
            <div key={step.key} className="flex items-center gap-4 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                ${isDone ? 'bg-green-500/20 border-2 border-green-500 text-green-300' :
                  isCurrent ? 'bg-gold-500/20 border-2 border-gold-400 text-gold-300 animate-pulse' :
                  'bg-dark-700 border border-dark-600/60 text-gray-600'}`}>
                {isDone ? '✓' : isCurrent ? step.icon : <span className="opacity-30">{idx + 1}</span>}
              </div>
              <span className={`text-sm ${isDone ? 'text-white font-medium' : isCurrent ? 'text-gold-300 font-semibold' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
        {isCancelled && (
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm bg-red-500/20 border-2 border-red-500 text-red-300 flex-shrink-0">
              ✕
            </div>
            <span className="text-sm text-red-400 font-semibold capitalize">{artisanOrder.status}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await orderAPI.getTracking(id);
      setOrder(data);
    } catch (err) {
      toast.error('Failed to load order tracking');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  // Real-time update
  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail?.payload;
      if (payload?.orderId === id || payload?.id === id) fetchOrder(true);
    };
    window.addEventListener('kala:sync:orders_updated', handler);
    window.addEventListener('kala:sync:artisan_orders_updated', handler);
    return () => {
      window.removeEventListener('kala:sync:orders_updated', handler);
      window.removeEventListener('kala:sync:artisan_orders_updated', handler);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p>Order not found</p>
          <Link to="/orders" className="text-gold-400 hover:underline mt-2 inline-block">← Back to Orders</Link>
        </div>
      </div>
    );
  }

  const artisanOrders = order.artisan_orders || [];
  const isMultiArtisan = artisanOrders.length > 1;

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/orders" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <HiArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
          >
            <HiRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 border border-dark-700/60 rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-white">
                {order.order_number || `Order #${id?.substring(0, 8)}`}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Placed {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.order_status || order.status || 'pending'} />
              <StatusBadge status={order.payment_status || 'pending'} />
            </div>
          </div>

          {/* Payment & Delivery Info */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-dark-700/40 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Payment Method</p>
              <p className="text-white font-medium capitalize">
                {order.payment_method === 'razorpay' ? '💳 Online (Razorpay)' :
                 order.payment_method === 'cod' ? '💵 Cash on Delivery' :
                 order.payment_method || 'N/A'}
              </p>
            </div>
            <div className="bg-dark-700/40 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Total Amount</p>
              <p className="text-gold-400 font-bold text-lg">
                ₹{(order.total_amount || order.total_price || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-dark-700/40 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Delivering to</p>
              <p className="text-white text-xs leading-relaxed line-clamp-2">
                {order.shipping_name && <strong>{order.shipping_name}, </strong>}
                {order.shipping_city || order.shipping_address?.split(',')[0]}
              </p>
            </div>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="mt-5">
              <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide font-semibold">Items</p>
              <div className="flex flex-wrap gap-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-dark-700/40 rounded-lg px-3 py-2">
                    {item.product_image_snapshot && (
                      <img src={item.product_image_snapshot} alt="" className="w-8 h-8 rounded object-cover" />
                    )}
                    <div>
                      <p className="text-white text-xs font-medium line-clamp-1">{item.product_name_snapshot || 'Item'}</p>
                      <p className="text-gray-500 text-xs">Qty: {item.quantity} · Size: {item.size || 'Standard'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Artisan Order Tracking */}
        {artisanOrders.length > 0 ? (
          <div className="space-y-4">
            {isMultiArtisan && (
              <div className="text-center">
                <p className="text-gold-400 text-sm font-medium">
                  🎨 This order has items from {artisanOrders.length} artisans — tracked separately below
                </p>
              </div>
            )}

            {artisanOrders.map((ao, idx) => (
              <motion.div
                key={ao.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-dark-800 border border-dark-700/60 rounded-2xl p-6"
              >
                {/* Artisan Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {ao.artisan?.profile_image && (
                      <img src={ao.artisan.profile_image} alt={ao.artisan?.store_name} className="w-10 h-10 rounded-full object-cover border border-dark-600" />
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {ao.artisan?.store_name || `Artisan ${idx + 1}`}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Subtotal: ₹{(ao.subtotal || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={ao.status} />
                </div>

                {/* Timeline */}
                <ArtisanTimeline artisanOrder={ao} />

                {/* Delivery timestamps */}
                <div className="mt-4 space-y-1">
                  {ao.accepted_at && (
                    <p className="text-xs text-gray-500">
                      ✓ Accepted: {new Date(ao.accepted_at).toLocaleString('en-IN')}
                    </p>
                  )}
                  {ao.dispatched_at && (
                    <p className="text-xs text-gray-500">
                      🚚 Dispatched: {new Date(ao.dispatched_at).toLocaleString('en-IN')}
                    </p>
                  )}
                  {ao.delivered_at && (
                    <p className="text-xs text-green-400">
                      🎉 Delivered: {new Date(ao.delivered_at).toLocaleString('en-IN')}
                    </p>
                  )}
                  {ao.rejection_reason && (
                    <p className="text-xs text-red-400 mt-2">
                      ❌ Reason: {ao.rejection_reason}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* No artisan_orders yet (order just placed, being processed) */
          <div className="bg-dark-800 border border-dark-700/60 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-white font-semibold">Order Confirmed</p>
            <p className="text-gray-400 text-sm mt-1">
              {order.payment_method === 'cod'
                ? 'Your COD order is confirmed! Artisan will start preparing soon.'
                : 'Payment received. Artisan will accept and start preparing your order soon.'}
            </p>
          </div>
        )}

        {/* Need Help */}
        <div className="bg-dark-800/50 border border-dark-700/40 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-xs">
            Need help with this order?{' '}
            <a
              href={`https://wa.me/917676558335?text=Hi, I need help with my order ${order.order_number || id?.substring(0, 8)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline"
            >
              Chat on WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
