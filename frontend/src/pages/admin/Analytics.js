import React, { useEffect, useState } from 'react';
import { 
  HiTrendingUp, 
  HiCurrencyRupee, 
  HiUserGroup, 
  HiUsers, 
  HiCollection, 
  HiShoppingBag,
  HiRefresh
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: res } = await adminAPI.getAnalytics();
      setData(res);
    } catch {
      toast.error('Failed to load marketplace analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiTrendingUp className="text-gold-400 w-7 h-7" /> Marketplace Analytics & Growth Intelligence
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Data insights on Indian handicraft revenue trends, artisan registration, and product categories.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Trends
        </button>
      </div>

      {/* Aggregate High-Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-gold-500">
          <p className="text-xs font-semibold text-gray-400">Total Platform Revenue</p>
          <p className="text-2xl font-bold text-white mt-1">₹{(data?.totalRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gold-400 mt-1">Gross Merchandise Volume</p>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-gray-400">Total Orders Placed</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{data?.totalOrders || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Fulfilled by artisans</p>
        </div>
        <div className="card p-5 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-gray-400">Master Artisans</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{data?.totalArtisans || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Across 7 craft categories</p>
        </div>
        <div className="card p-5 border-l-4 border-l-green-500">
          <p className="text-xs font-semibold text-gray-400">Cataloged Products</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{data?.totalProducts || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Active handmade items</p>
        </div>
      </div>

      {/* Monthly Revenue Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend Bar Chart Visual */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <HiCurrencyRupee className="text-gold-400 w-5 h-5" /> Monthly Sales & Revenue (Last 6 Months)
          </h3>
          {data?.monthlyRevenue?.length > 0 ? (
            <div className="space-y-3 pt-2">
              {data.monthlyRevenue.map((m, idx) => {
                const max = Math.max(...data.monthlyRevenue.map(x => x.revenue), 1000);
                const pct = Math.max(8, Math.round((m.revenue / max) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-medium">{m.month}</span>
                      <span className="text-gold-400 font-bold">₹{m.revenue.toLocaleString('en-IN')} ({m.orders} orders)</span>
                    </div>
                    <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs">No monthly data available yet.</div>
          )}
        </div>

        {/* Popular Categories Breakdown */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <HiCollection className="text-purple-400 w-5 h-5" /> Category Share & Product Density
          </h3>
          {data?.categoryDistribution?.length > 0 ? (
            <div className="space-y-3 pt-2">
              {data.categoryDistribution.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 font-medium truncate max-w-xs">{c.name}</span>
                    <span className="text-purple-400 font-bold">{c.count} items ({c.percentage}%)</span>
                  </div>
                  <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, c.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs">No category data recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
