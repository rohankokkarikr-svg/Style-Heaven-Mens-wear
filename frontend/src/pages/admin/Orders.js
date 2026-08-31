import React, { useEffect, useState } from 'react';
import { 
  HiSearch, 
  HiFilter, 
  HiShoppingBag, 
  HiEye, 
  HiRefresh, 
  HiX,
  HiCheckCircle,
  HiClock,
  HiTruck
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getOrders({ search, status: statusFilter });
      setOrders(data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (id, newStatus, newPaymentStatus) => {
    setUpdating(true);
    try {
      await adminAPI.updateOrderStatus(id, { 
        status: newStatus,
        payment_status: newPaymentStatus
      });
      toast.success(`Order status updated to ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === id ? { 
        ...o, 
        status: newStatus, 
        ...(newPaymentStatus ? { payment_status: newPaymentStatus } : {}) 
      } : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, ...(newPaymentStatus ? { payment_status: newPaymentStatus } : {}) }));
      }
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'delivered':
        return <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">🟢 Delivered</span>;
      case 'shipped':
        return <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30">🚚 Shipped</span>;
      case 'processing':
        return <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">📦 Processing</span>;
      case 'confirmed':
        return <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">🔵 Confirmed</span>;
      case 'cancelled':
        return <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">🔴 Cancelled</span>;
      default:
        return <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🟡 Pending</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">Order Management & Fulfillment</h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor customer orders, track artisan fulfillment, and update delivery milestones.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer, phone..."
              className="w-full bg-dark-700 border border-dark-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/60"
            />
          </div>
          <button type="submit" className="btn-primary text-xs py-2 px-3">Search</button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all border ${
                statusFilter === st
                  ? 'bg-gold-500/20 border-gold-500/50 text-gold-400 font-semibold'
                  : 'border-dark-600 text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 shimmer rounded-lg" />)}
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-800/80 text-gray-400 border-b border-dark-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-gold-400 font-bold">
                        #{o.id ? o.id.slice(0, 8).toUpperCase() : 'ORDER'}
                      </span>
                      <p className="text-[10px] text-gray-500">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white truncate">{o.users?.name || 'Customer'}</p>
                      <p className="text-gray-400 text-[10px] truncate">{o.users?.email || o.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {o.order_items?.length > 0 ? (
                        <span>{o.order_items.length} item(s)</span>
                      ) : (
                        <span>1 product</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">₹{Number(o.total_price || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-400">{o.payment_method || 'Online'}</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold ${
                        o.payment_status === 'paid' || o.payment_status === 'successful' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {o.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 ml-auto"
                      >
                        <HiEye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            No orders found matching your search.
          </div>
        )}
      </div>

      {/* Modal: Order Details & Status Update */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-xl w-full p-6 space-y-4 border border-dark-500 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <HiX className="w-5 h-5" />
            </button>

            <div>
              <span className="text-gold-400 font-mono text-xs font-bold">
                ORDER #{selectedOrder.id?.slice(0, 8).toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">Order Fulfillment Details</h3>
              <p className="text-gray-400 text-xs">
                Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="p-3 bg-dark-750 rounded-xl border border-dark-600 space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Update Order Delivery Status:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
                  <button
                    key={st}
                    disabled={updating}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={`text-xs px-2.5 py-1 rounded-lg capitalize border font-medium transition-all ${
                      (selectedOrder.status || 'pending').toLowerCase() === st
                        ? 'bg-gold-500 border-gold-500 text-dark-900 font-bold'
                        : 'border-dark-600 text-gray-400 hover:text-white hover:border-dark-500'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-dark-750 border border-dark-600 space-y-1">
                <p className="font-bold text-white">Customer Information</p>
                <p className="text-gray-300">{selectedOrder.users?.name || 'Customer'}</p>
                <p className="text-gray-400">{selectedOrder.users?.email}</p>
                <p className="text-gray-400">Phone: {selectedOrder.phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-dark-750 border border-dark-600 space-y-1">
                <p className="font-bold text-white">Shipping Address</p>
                <p className="text-gray-300 leading-relaxed">{selectedOrder.shipping_address || 'Address on file'}</p>
              </div>
            </div>

            {/* Items in Order */}
            <div className="space-y-2 text-xs border-t border-dark-600 pt-3">
              <p className="font-bold text-white">Ordered Handcrafted Items</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(selectedOrder.order_items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-dark-750 border border-dark-600">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.products?.image_url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100'}
                        alt=""
                        className="w-8 h-8 rounded object-cover ring-1 ring-dark-500 shrink-0"
                      />
                      <div>
                        <p className="font-medium text-white truncate max-w-xs">{item.products?.name || 'Handicraft Item'}</p>
                        <p className="text-[10px] text-gray-400">Qty: {item.quantity} • Size: {item.size || 'Standard'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gold-400">
                      ₹{((item.price_at_time || item.products?.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="flex justify-between items-center text-sm font-bold text-white border-t border-dark-600 pt-3">
              <span>Total Amount Paid</span>
              <span className="text-gold-400 text-lg">₹{Number(selectedOrder.total_price || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
