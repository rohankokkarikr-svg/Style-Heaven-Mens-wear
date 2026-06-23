import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { HiShoppingBag, HiPencilAlt } from 'react-icons/hi';
import toast from 'react-hot-toast';
import ReviewModal from '../components/ReviewModal';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewProduct, setReviewProduct] = useState(null);

  const isCancelable = (order) => {
    if (order.status?.toLowerCase() !== 'pending') return false;
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
      await orderAPI.cancelOrder(orderId);
      toast.success('Order cancelled successfully! 🚫');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
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
      default: return 'text-gold-400 bg-gold-500/10 border-gold-500/20'; // pending/processing
    }
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
                  {order.status}
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
                      onClick={() => setReviewProduct(item.product || { name: item.product?.name || 'Style Heaven Product' })}
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
                    {order.payment_method ? order.payment_method.replace('_', ' ') : 'Cash on Delivery'}
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

            {isCancelable(order) && (
              <div className="mt-6 pt-4 border-t border-dark-600 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-gray-500 italic">
                  ⏱️ {getRemainingTimeText(order.created_at)}
                </span>
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-500 border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                >
                  🚫 Cancel Order
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ReviewModal 
        isOpen={!!reviewProduct} 
        onClose={() => setReviewProduct(null)} 
        product={reviewProduct} 
      />
    </div>
  );
}
