import React, { useEffect, useState } from 'react';
import { artisanAPI } from '../../services/api';
import { HiCurrencyRupee, HiTrendingUp } from 'react-icons/hi';
export default function ArtisanEarnings() {
  const [stats, setStats] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { artisanAPI.getMyStats().then(({ data }) => { setStats(data); setLoading(false); }).catch(() => setLoading(false)); }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-serif font-bold text-white">Earnings</h1><p className="text-gray-400 text-sm mt-1">Your sales and revenue summary</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: '₹' + (stats?.totalRevenue || 0).toLocaleString(), icon: HiCurrencyRupee, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Total Orders', value: stats?.totalOrders || 0, icon: HiTrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Total Products', value: stats?.totalProducts || 0, icon: HiCurrencyRupee, color: 'text-gold-400', bg: 'bg-gold-400/10' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={'p-3 rounded-xl ' + s.bg}><s.icon className={'w-6 h-6 ' + s.color} /></div>
            <div><p className="text-gray-400 text-sm">{s.label}</p><p className={'text-2xl font-bold ' + s.color}>{loading ? '...' : s.value}</p></div>
          </div>
        ))}
      </div>
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4 text-lg">Recent Sales</h3>
        {!loading && stats?.recentOrders?.length > 0 ? (
          <div className="space-y-3">{stats.recentOrders.slice(0,8).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-dark-600/50">
              <div><p className="text-gray-300 text-sm font-medium">{item.products?.name || 'Product'}</p><p className="text-gray-500 text-xs">Qty: {item.quantity}</p></div>
              <span className="text-gold-400 font-bold">+Rs.{(item.price_at_time * item.quantity).toLocaleString()}</span>
            </div>
          ))}</div>
        ) : <div className="text-center py-8 text-gray-500"><div className="text-4xl mb-3">💰</div><p>No earnings yet. Publish products to start selling!</p></div>}
      </div>
    </div>
  );
}
