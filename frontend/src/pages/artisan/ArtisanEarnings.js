import React, { useEffect, useState } from 'react';
import { artisanAPI } from '../../services/api';
import { HiCurrencyRupee, HiTrendingUp, HiShoppingBag, HiClock, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const SETTLEMENT_COLORS = {
  pending:  'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  settled:  'bg-green-500/20 text-green-300 border border-green-500/30',
  failed:   'bg-red-500/20 text-red-300 border border-red-500/30',
};

export default function ArtisanEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Try new earnings endpoint first
        const res = await artisanAPI.getEarnings();
        setData(res.data);
      } catch (err) {
        // Fallback to stats
        try {
          const statsRes = await artisanAPI.getMyStats();
          setStatsData(statsRes.data);
        } catch (e2) {
          toast.error('Failed to load earnings');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = data?.totals || {
    gross: statsData?.totalRevenue || 0,
    commission: 0,
    net: statsData?.totalRevenue || 0,
    settled: 0,
    pending: statsData?.totalRevenue || 0,
  };

  const earnings = data?.earnings || [];

  const stats = [
    { label: 'Total Revenue', value: `₹${totals.gross.toLocaleString('en-IN')}`, icon: HiCurrencyRupee, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Platform Commission', value: `₹${totals.commission.toLocaleString('en-IN')}`, icon: HiTrendingUp, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Net Earnings', value: `₹${totals.net.toLocaleString('en-IN')}`, icon: HiCurrencyRupee, color: 'text-gold-400', bg: 'bg-gold-400/10' },
    { label: 'Pending Settlement', value: `₹${totals.pending.toLocaleString('en-IN')}`, icon: HiClock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Settled Amount', value: `₹${totals.settled.toLocaleString('en-IN')}`, icon: HiCheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Orders', value: earnings.length || statsData?.totalOrders || 0, icon: HiShoppingBag, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-white">Earnings & Settlement</h1>
        <p className="text-gray-400 text-sm mt-1">Your sales revenue, platform fees, and settlement status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-dark-800 border border-dark-700/60 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{loading ? '...' : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Earnings Table */}
      <div className="bg-dark-800 border border-dark-700/60 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-dark-700/60">
          <h3 className="font-semibold text-white text-lg">Earnings per Delivery</h3>
          <p className="text-gray-500 text-xs mt-1">Earnings are recorded after each successful delivery</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto mb-3" />
            Loading earnings...
          </div>
        ) : earnings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700/40">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Order</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Gross</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Commission</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Net</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/40">
                {earnings.map((e, i) => (
                  <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">
                        {e.order?.order_number || `#${e.order_id?.substring(0, 8)}`}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {e.order?.created_at ? new Date(e.order.created_at).toLocaleDateString('en-IN') : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">
                      ₹{(e.gross_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      −₹{(e.platform_commission || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-gold-400 font-bold">
                      ₹{(e.net_earning || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${SETTLEMENT_COLORS[e.settlement_status] || 'bg-gray-500/20 text-gray-300'}`}>
                        {e.settlement_status === 'pending' ? '⏳ Pending' : e.settlement_status === 'settled' ? '✓ Settled' : e.settlement_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Fallback to legacy stats if no earnings records yet */
          statsData?.recentOrders?.length > 0 ? (
            <div className="p-5 space-y-3">
              {statsData.recentOrders.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-dark-600/40 last:border-0">
                  <div>
                    <p className="text-gray-300 text-sm font-medium">{item.products?.name || 'Product'}</p>
                    <p className="text-gray-500 text-xs">Qty: {item.quantity} · Order: #{item.orders?.id?.substring(0, 8)}</p>
                  </div>
                  <span className="text-gold-400 font-bold">
                    +₹{((item.price_at_time || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500">
              <div className="text-5xl mb-3">💰</div>
              <p className="font-semibold text-white">No earnings yet</p>
              <p className="text-sm mt-1">Earnings are recorded after each successful delivery</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
