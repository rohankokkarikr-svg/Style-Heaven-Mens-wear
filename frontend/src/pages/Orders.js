import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { HiShoppingBag, HiPencilAlt } from 'react-icons/hi';
import toast from 'react-hot-toast';
import ReviewModal from '../components/ReviewModal';
import EditOrderModal from '../components/EditOrderModal';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const isCancelable = (order) => {
    const st = order.status?.toLowerCase();
    if (st !== 'pending' && st !== 'payment_verification_pending') return false;
    const ageMs = Date.now() - new Date(order.created_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    return ageHours <= 12;
  };

  const getRemainingTimeText = (createdAt) => {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const remainingMs = (12 * 60 * 60 * 1000) - ageMs;
    if (remainingMs <= 0) return '';
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m left to cancel`;
    }
    return `${minutes}m left to cancel`;
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order? This action cannot be undone.');
    if (!confirmCancel) return;

    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const res = await orderAPI.cancelOrder(orderId);
      toast.success('Order cancelled successfully! 🚫');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      
      const adminPhone = '917349083982';
      let waLink = res.data?.whatsappLink;
      if (!waLink) {
        const msg = `🚨 *Order Cancelled on KalaStyle AI!*\n----------------------------------------\n📦 *Order ID:* #${orderId?.substring(0, 8)}\n📞 *Phone:* +91 ${targetOrder?.phone || ''}\n💰 *Total Amount:* ₹${targetOrder?.total_price?.toLocaleString()}\n----------------------------------------\n❌ *Status:* CANCELLED`;
        waLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
      }
      try {
        window.open(waLink, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Auto open WhatsApp popup blocked:', e);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await orderAPI.getMyOrders();
        setOrders(data);
      } catch (err) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'shipped': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'payment_verification_pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse';
      default: return 'text-gold-400 bg-gold-500/10 border-gold-500/20'; // pending/processing
    }
  };

  const renderStatusText = (status) => {
    if (status === 'payment_verification_pending') return '⏱️ Pending Verification';
    return status;
  };

  const getEffectivePaymentMethod = (order) => {
    let pm = order.payment_method || '';
    if (!pm && order.shipping_address) {
      const match = order.shipping_address.match(/\[Method:\s*([^\]]+)\]/i);
      if (match) pm = match[1];
    }
    if (!pm) return 'Cash on Delivery (COD)';
    const pmLower = pm.toLowerCase();
    if (pmLower.includes('upi') || pmLower.includes('phonepe') || pmLower.includes('online')) {
      return 'UPI / PhonePe QR';
    }
    if (pmLower.includes('cod')) {
      return 'Cash on Delivery (COD)';
    }
    return pm.replace('_', ' ');
  };

  const buildWhatsappLink = (order) => {
    const adminPhone = '917349083982';
    const itemsText = (order.items || []).map(i => `• ${i.product?.name || 'Item'} (Size: ${i.size}, Qty: ${i.quantity}) - ₹${((i.price_at_time || 0) * (i.quantity || 1)).toLocaleString()}`).join('\n');
    const msg = `🔔 *Order Details from KalaStyle AI!*\n----------------------------------------\n📦 *Order ID:* #${order.id?.substring(0, 8)}\n📞 *Phone:* +91 ${order.phone || ''}\n📍 *Address:* ${order.shipping_address || ''}\n\n🛒 *Items:*\n${itemsText || 'No items'}\n\n💰 *Payment Method:* ${getEffectivePaymentMethod(order)}\n💵 *Total Amount:* ₹${order.total_price?.toLocaleString()}\n----------------------------------------\n✅ *Status:* ${order.status || 'Pending'}`;
    return `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <HiShoppingBag className="w-20 h-20 text-dark-500 mb-6" />
        <h2 className="text-2xl font-serif font-bold text-white mb-2">No orders yet</h2>
        <p className="text-gray-400 mb-8">When you place an order, it will appear here.</p>
        <Link to="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-8">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-card">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 border-b border-dark-600 pb-4">
              <div>
                <p className="text-sm font-semibold text-gray-300">Order #{order.id?.substring(0,8)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Amount</p>
                  <p className="font-extrabold text-white text-lg">₹{order.total_price?.toLocaleString()}</p>
                  {order.discount_amount > 0 && (
                    <p className="text-[10px] text-gold-400 font-medium animate-pulse">
                      Save ₹{order.discount_amount.toLocaleString()} with {order.coupon_code}
                    </p>
                  )}
                </div>
                <span className={`badge border px-3 py-1 uppercase tracking-wider text-xs font-bold ${getStatusColor(order.status)}`}>
                  {renderStatusText(order.status)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-dark-900 rounded border border-dark-600 overflow-hidden shrink-0">
                    <img 
                      src={item.product?.image_url} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Size: {item.size} • Qty: {item.quantity}
                    </p>
                    <button
                      onClick={() => setReviewProduct(item.product || { name: item.product?.name || 'KalaStyle AI Product' })}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-semibold border border-gold-500/30 hover:border-gold-500/60 px-2.5 py-1.5 rounded-md bg-gold-500/5 hover:bg-gold-500/10 transition-all cursor-pointer"
                    >
                      <HiPencilAlt className="w-3.5 h-3.5" />
                      Write a Review
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-300 font-semibold">₹{(item.price_at_time * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Details block */}
            <div className="mt-6 pt-4 border-t border-dark-600 flex flex-wrap gap-4 text-xs justify-between items-center bg-dark-900/50 p-4 rounded-xl">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Payment Method</span>
                  <span className="font-bold text-gray-300 capitalize">
                    {getEffectivePaymentMethod(order)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Payment Status</span>
                  <span className={`font-black capitalize ${
                    order.payment_status?.toLowerCase() === 'paid' ? 'text-green-400' : 'text-amber-500'
                  }`}>
                    {order.payment_status || 'Pending'}
                  </span>
                </div>
              </div>
              {order.transaction_id && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Transaction ID</span>
                  <span className="font-mono font-bold text-gray-300 bg-dark-900 px-2 py-1 rounded border border-dark-600">{order.transaction_id}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-dark-600 flex items-center justify-between flex-wrap gap-3">
              <span className="text-[11px] text-gray-400 italic font-medium flex items-center gap-1">
                {isCancelable(order) ? `⏱️ ${getRemainingTimeText(order.created_at)}` : ''}
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <a
                  href={buildWhatsappLink(order)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-semibold text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-500/60 bg-green-500/5 hover:bg-green-500/10 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 no-underline"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.143 4.174 4.29-1.125z" />
                  </svg>
                  Send to Admin WhatsApp
                </a>
                {isCancelable(order) && (
                  <>
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="px-4 py-2 text-xs font-semibold text-gold-400 hover:text-gold-300 border border-gold-500/30 hover:border-gold-500/60 bg-gold-500/5 hover:bg-gold-500/10 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <HiPencilAlt className="w-3.5 h-3.5" /> Edit Order
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-500 border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      🚫 Cancel Order
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReviewModal 
        isOpen={!!reviewProduct} 
        onClose={() => setReviewProduct(null)} 
        product={reviewProduct} 
      />

      <EditOrderModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        remainingTimeText={editingOrder ? getRemainingTimeText(editingOrder.created_at) : ''}
        onOrderUpdated={(updated) => {
          setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
        }}
      />
    </div>
  );
}
