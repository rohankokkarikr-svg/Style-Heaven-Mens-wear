import React, { useEffect, useState } from 'react';
import { 
  HiCurrencyRupee, 
  HiCheckCircle, 
  HiClock, 
  HiXCircle, 
  HiRefresh,
  HiSearch,
  HiFilter
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getPayments();
      setPayments(data || []);
    } catch {
      toast.error('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = !search || 
      p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      p.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId?.toLowerCase().includes(search.toLowerCase());

    const s = (p.status || '').toLowerCase();
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'successful' && (s === 'successful' || s === 'paid')) ||
      (statusFilter === 'pending' && s === 'pending') ||
      (statusFilter === 'failed' && s === 'failed');

    return matchesSearch && matchesStatus;
  });

  const totalVolume = payments
    .filter(p => (p.status || '').toLowerCase() === 'successful' || (p.status || '').toLowerCase() === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadge = (st) => {
    const s = (st || 'pending').toLowerCase();
    if (s === 'successful' || s === 'paid') {
      return <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">🟢 Successful</span>;
    }
    if (s === 'failed') {
      return <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">🔴 Failed</span>;
    }
    if (s === 'refunded') {
      return <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">🔵 Refunded</span>;
    }
    return <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🟡 Pending</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiCurrencyRupee className="text-gold-400 w-7 h-7" /> Payment Monitoring & Settlements
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time tracking of marketplace transactions, payment gateways, and settlement records.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Transactions
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-green-500">
          <p className="text-xs font-semibold text-gray-400">Total Settled Volume</p>
          <p className="text-2xl font-bold text-white mt-1">₹{totalVolume.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-green-400 mt-1">✓ Verified platform payments</p>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-gray-400">Total Transactions</p>
          <p className="text-2xl font-bold text-white mt-1">{payments.length}</p>
          <p className="text-[10px] text-gray-400 mt-1">Across all payment methods</p>
        </div>
        <div className="card p-5 border-l-4 border-l-gold-500">
          <p className="text-xs font-semibold text-gray-400">Platform Gateway Health</p>
          <p className="text-2xl font-bold text-gold-400 mt-1">100% Operational</p>
          <p className="text-[10px] text-gray-400 mt-1">Razorpay UPI & Cards Active</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:w-96">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by transaction ID, customer, order ID..."
            className="w-full bg-dark-700 border border-dark-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <HiFilter className="text-gray-500 w-4 h-4 shrink-0" />
          <span className="text-xs text-gray-400 shrink-0">Status:</span>
          {['all', 'successful', 'pending', 'failed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all border ${
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

      {/* Payments Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 shimmer rounded-lg" />)}
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-800/80 text-gray-400 border-b border-dark-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/50">
                {filteredPayments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-gold-400 font-semibold">{p.transactionId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-gray-400">#{p.orderId?.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white truncate">{p.customerName}</p>
                      <p className="text-gray-400 text-[10px] truncate">{p.customerEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white">₹{p.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">
                      {p.date ? new Date(p.date).toLocaleString('en-IN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}
