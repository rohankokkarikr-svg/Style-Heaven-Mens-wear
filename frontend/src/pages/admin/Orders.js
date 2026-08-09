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
                        <p className="text-xs text-gray-500 mt-0.5">{o.phone}</p>
                      </td>
                      <td className="p-4 font-black text-white text-sm">₹{o.total_price.toLocaleString()}</td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-gray-300 capitalize">
                          {o.payment_method ? o.payment_method.replace('_', ' ') : 'COD'}
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
