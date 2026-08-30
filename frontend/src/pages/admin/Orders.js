import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const extractRefNo = (o) => {
    if (o.transaction_id && o.transaction_id.trim() && !o.transaction_id.startsWith('TXN_')) {
      return o.transaction_id.trim();
    }
    if (o.shipping_address) {
      const match = o.shipping_address.match(/Ref\.?\s*No\.?:\s*([A-Za-z0-9_]+)/i);
      if (match) return match[1];
      const txnMatch = o.shipping_address.match(/TXN:?\s*([A-Za-z0-9_]+)/i);
      if (txnMatch) return txnMatch[1];
    }
    if (o.transaction_id) return o.transaction_id;
    return null;
  };

  const getEffectivePaymentMethod = (o) => {
    let pm = o.payment_method || '';
    if (!pm && o.shipping_address) {
      const match = o.shipping_address.match(/\[Method:\s*([^\]]+)\]/i);
      if (match) pm = match[1];
    }
    if (!pm) return 'COD (Cash on Delivery)';
    const pmLower = pm.toLowerCase();
    if (pmLower.includes('upi') || pmLower.includes('phonepe') || pmLower.includes('online')) {
      return 'UPI / PhonePe QR';
    }
    if (pmLower.includes('cod')) {
      return 'COD (Cash on Delivery)';
    }
    return pm.replace('_', ' ');
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = (filter !== 'all' && filter !== 'payment_verification_pending') ? { status: filter } : {};
      const { data } = await orderAPI.getAll(params);
      let list = data || [];
      if (filter === 'payment_verification_pending') {
        list = list.filter(o => 
          o.payment_status === 'pending_verification' || 
          o.status === 'payment_verification_pending' || 
          (o.shipping_address && o.shipping_address.includes('Status: Pending Verification')) ||
          (o.shipping_address && o.shipping_address.includes('Ref. No:'))
        );
      }
      setOrders(list);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await orderAPI.updateStatus(id, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleVerifyPayment = async (id, action) => {
    setVerifyingId(id);
    try {
      await orderAPI.verifyPayment(id, { action });
      if (action === 'approve') {
        toast.success('Payment verified & Order confirmed! 🎉');
      } else {
        toast.error('Payment rejected & Order cancelled');
      }
      fetchOrders();
    } catch (err) {
      toast.error('Failed to verify payment');
    } finally {
      setVerifyingId(null);
    }
  };

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

  const buildCustomerWhatsappLink = (o) => {
    if (!o.phone) return null;
    let digits = String(o.phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;
    const msg = `Hello ${o.users?.name || 'Customer'}, regarding your KalaStyle AI Order #${o.id?.substring(0, 8)} (Total: ₹${o.total_price?.toLocaleString()})...`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">Manage Orders</h1>
        
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'payment_verification_pending', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer ${
                filter === st 
                  ? 'bg-gold-500 text-dark-900 shadow-sm' 
                  : 'bg-dark-800 text-gray-400 hover:text-gold-400 border border-dark-600'
              }`}
            >
              {st === 'payment_verification_pending' ? 'Verification Pending ⏱️' : st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-600 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-900/50 border-b border-dark-600">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment & Ref. No.</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/50">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-400">No orders found.</td></tr>
              ) : (
                orders.map((o) => {
                  const refNo = extractRefNo(o);
                  const isPendingVerif = o.payment_status === 'pending_verification' || 
                    o.status === 'payment_verification_pending' || 
                    (o.shipping_address && o.shipping_address.includes('Status: Pending Verification')) ||
                    (o.shipping_address && o.shipping_address.includes('Ref. No:'));

                  return (
                    <tr key={o.id} className="hover:bg-dark-900/30 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-400">#{o.id.substring(0,8)}</td>
                      <td className="p-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <p className="text-white font-bold text-sm">{o.users?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <span>{o.phone}</span>
                          {buildCustomerWhatsappLink(o) && (
                            <a
                              href={buildCustomerWhatsappLink(o)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat with customer on WhatsApp"
                              className="text-green-400 hover:text-green-300 ml-1 inline-flex items-center"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.143 4.174 4.29-1.125z" />
                              </svg>
                            </a>
                          )}
                        </p>
                      </td>
                      <td className="p-4 font-black text-white text-sm">₹{o.total_price.toLocaleString()}</td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-gray-300 capitalize">
                          {getEffectivePaymentMethod(o)}
                        </p>
                        <p className={`text-[10px] font-black capitalize ${
                          o.payment_status?.toLowerCase() === 'paid' 
                            ? 'text-green-400' 
                            : isPendingVerif 
                              ? 'text-amber-400 font-bold animate-pulse' 
                              : 'text-amber-500'
                        }`}>
                          {isPendingVerif ? '⏱️ Ref Submitted (Pending Admin Verification)' : (o.payment_status || 'Pending')}
                        </p>
                        {refNo ? (
                          <div className="mt-1">
                            <span className="text-xs font-mono text-gold-300 font-extrabold bg-gold-500/15 px-2.5 py-1 rounded-md border border-gold-500/40 inline-block shadow-sm">
                              🔑 UTR / Ref. No: {refNo}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic block mt-0.5">No Ref. No.</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`badge border px-2.5 py-1 uppercase text-[10px] font-bold ${getStatusColor(o.status)}`}>
                          {renderStatusText(o.status)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isPendingVerif ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyPayment(o.id, 'approve')}
                              disabled={verifyingId === o.id}
                              className="px-2.5 py-1 text-[11px] font-bold text-green-400 hover:text-green-300 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 rounded-md transition-all cursor-pointer"
                            >
                              ✅ Verify & Approve
                            </button>
                            <button
                              onClick={() => handleVerifyPayment(o.id, 'reject')}
                              disabled={verifyingId === o.id}
                              className="px-2.5 py-1 text-[11px] font-bold text-red-400 hover:text-red-300 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-all cursor-pointer"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        ) : (
                          <select 
                            className="bg-dark-900 border border-dark-500 text-xs rounded-lg px-2 py-1 text-white outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 font-semibold cursor-pointer"
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
