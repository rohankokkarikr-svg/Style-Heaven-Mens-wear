import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await orderAPI.getAll(params);
      setOrders(data);
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

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'shipped': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gold-400 bg-gold-500/10 border-gold-500/20'; // pending/processing
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">Manage Orders</h1>
        
        <div className="flex gap-2">
          {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer ${
                filter === st 
                  ? 'bg-gold-500 text-dark-900 shadow-sm' 
                  : 'bg-dark-800 text-gray-400 hover:text-gold-400 border border-dark-600'
              }`}
            >
              {st}
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
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/50">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-400">No orders found.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-dark-900/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-400">#{o.id.substring(0,8)}</td>
                    <td className="p-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <p className="text-white font-bold text-sm">{o.users?.name || 'User'}</p>
                      <p className="text-xs text-gray-550 mt-0.5">{o.phone}</p>
                    </td>
                    <td className="p-4 font-black text-white text-sm">₹{o.total_price.toLocaleString()}</td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-gray-300 capitalize">
                        {o.payment_method ? o.payment_method.replace('_', ' ') : 'COD'}
                      </p>
                      <p className={`text-[10px] font-black capitalize ${
                        o.payment_status?.toLowerCase() === 'paid' ? 'text-green-400' : 'text-amber-500'
                      }`}>
                        {o.payment_status || 'Pending'}
                      </p>
                      {o.transaction_id && (
                        <p className="text-[9px] font-mono text-gray-400 mt-0.5 bg-dark-900 px-1 py-0.5 rounded border border-dark-600 inline-block">{o.transaction_id}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`badge border px-2.5 py-1 uppercase text-[10px] font-bold ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
