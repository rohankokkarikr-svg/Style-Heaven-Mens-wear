import React, { useEffect, useState, useCallback } from 'react';
import { artisanAPI } from '../../services/api';
import { supabase } from '../../lib/supabase';
import {
  HiCurrencyRupee,
  HiTrendingUp,
  HiShoppingBag,
  HiClock,
  HiCheckCircle,
  HiRefresh,
  HiShieldCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const SETTLEMENT_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  settled: 'bg-green-500/20 text-green-300 border border-green-500/30',
  failed:  'bg-red-500/20 text-red-300 border border-red-500/30',
};

export default function ArtisanEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // Primary: get direct real-time earnings from backend
      const res = await artisanAPI.getEarnings();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.warn('Earnings load notice, trying fallback stats...', err.message);
    }

    // Secondary / supplement stats for completeness
    try {
      const statsRes = await artisanAPI.getMyStats();
      if (statsRes.data) {
        setStatsData(statsRes.data);
      }
    } catch (e2) {
      // ignore
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    load();

    const handleSync = () => {
      load(true);
    };

    // 1. Unified Event Listeners for instant client-side real-time sync
    window.addEventListener('kala:sync:orders_updated', handleSync);
    window.addEventListener('kala:sync:artisan_orders_updated', handleSync);
    window.addEventListener('kala:sync:payments_updated', handleSync);
    window.addEventListener('kala:sync:earnings_updated', handleSync);
    window.addEventListener('kala:sync:all', handleSync);

    // 2. Direct Supabase Realtime Edge Listener
    let channel = null;
    try {
      if (supabase && typeof supabase.channel === 'function') {
        const chanId = 'live_artisan_earnings_' + Math.random().toString(36).substring(2, 8);
        channel = supabase.channel(chanId);
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'artisan_earnings' }, handleSync)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'artisan_orders' }, handleSync)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleSync)
          .subscribe();
      }
    } catch (realtimeErr) {
      console.warn('Supabase real-time subscription error:', realtimeErr);
    }

    // 3. Fallback polling every 10 seconds to guarantee freshness
    const timer = setInterval(() => {
      load(true);
    }, 10000);

    return () => {
      window.removeEventListener('kala:sync:orders_updated', handleSync);
      window.removeEventListener('kala:sync:artisan_orders_updated', handleSync);
      window.removeEventListener('kala:sync:payments_updated', handleSync);
      window.removeEventListener('kala:sync:earnings_updated', handleSync);
      window.removeEventListener('kala:sync:all', handleSync);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(timer);
    };
  }, [load]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
    toast.success('Earnings data synchronized in real-time! ⚡');
  };

  const totals = data?.totals || {
    gross: statsData?.totalRevenue || 0,
    commission: statsData?.totalRevenue ? Math.round(statsData.totalRevenue * 0.1) : 0,
    net: statsData?.totalRevenue ? statsData.totalRevenue - Math.round(statsData.totalRevenue * 0.1) : 0,
    settled: 0,
    pending: statsData?.totalRevenue ? statsData.totalRevenue - Math.round(statsData.totalRevenue * 0.1) : 0,
  };

  const earnings = data?.earnings || [];
  const activeOrders = data?.activeOrders || [];
  const totalOrdersCount = data?.totalOrders || earnings.length || statsData?.totalOrders || activeOrders.length || 0;

  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${totals.gross.toLocaleString('en-IN')}`,
      icon: HiCurrencyRupee,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      hint: 'Gross sales value',
    },
    {
      label: 'Platform Commission (10%)',
      value: `₹${totals.commission.toLocaleString('en-IN')}`,
      icon: HiTrendingUp,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      hint: 'Platform technology & logistics fee',
    },
    {
      label: 'Net Earnings (90%)',
      value: `₹${totals.net.toLocaleString('en-IN')}`,
      icon: HiCurrencyRupee,
      color: 'text-gold-400',
      bg: 'bg-gold-400/10',
      hint: 'Your net earnings payout',
    },
    {
      label: 'Pending Settlement',
      value: `₹${totals.pending.toLocaleString('en-IN')}`,
      icon: HiClock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      hint: 'Awaiting platform settlement',
    },
    {
      label: 'Settled Amount',
      value: `₹${totals.settled.toLocaleString('en-IN')}`,
      icon: HiCheckCircle,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      hint: 'Deposited to your bank',
    },
    {
      label: 'Total Orders',
      value: totalOrdersCount,
      icon: HiShoppingBag,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      hint: 'All fulfilled & active orders',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Live Real-Time Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-dark-700/60">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Earnings & Settlement
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time sales revenue, platform fees, and direct settlement tracking
          </p>
        </div>

        {/* Live sync badge and manual refresh button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Stream</span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-gold-500/50 cursor-pointer"
            title="Sync latest real-time data"
          >
            <HiRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-gold-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Real-Time'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-dark-800 border border-dark-700/60 rounded-xl p-4 flex flex-col justify-between hover:border-gold-500/30 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-gray-400 text-xs font-medium">{s.label}</span>
              <div className={`p-2 rounded-xl shrink-0 ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div>
              <p className={`text-xl font-bold tracking-tight ${s.color}`}>
                {loading ? (
                  <span className="inline-block w-16 h-5 bg-dark-700 animate-pulse rounded" />
                ) : (
                  s.value
                )}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">{s.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Earnings Table */}
      <div className="bg-dark-800 border border-dark-700/60 rounded-2xl overflow-hidden shadow-card">
        <div className="p-5 border-b border-dark-700/60 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
              <span>Earnings per Delivery & Orders</span>
              <span className="text-xs font-normal text-gold-400 font-mono">
                ({earnings.length || activeOrders.length} records)
              </span>
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Earnings are calculated transparently with a 10% platform fee and 90% artisan payout
            </p>
          </div>
          <span className="text-[11px] text-gray-400 hidden sm:inline-block">
            Last synced: {lastUpdated.toLocaleTimeString('en-IN')}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Fetching real-time earnings from database...</p>
          </div>
        ) : earnings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700/40">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Order Details</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Customer / Method</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Gross Amount</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Platform Fee (10%)</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Net Payout (90%)</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/40">
                {earnings.map((e, i) => (
                  <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-white font-bold text-xs font-mono">
                        {e.order?.order_number || `#${e.order_id?.substring(0, 8)}`}
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        {e.order?.created_at ? new Date(e.order.created_at).toLocaleString('en-IN') : 'Recent'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-gray-200 text-xs font-medium">
                        {e.order?.shipping_name || 'Customer'}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider">
                        {e.order?.payment_method === 'cod' ? '💵 Cash on Delivery' : '⚡ Online Razorpay'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-white font-semibold">
                      ₹{(Number(e.gross_amount) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-right text-red-400 font-medium">
                      −₹{(Number(e.platform_commission) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gold-400 font-bold text-base">
                      ₹{(Number(e.net_earning) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          SETTLEMENT_COLORS[e.settlement_status] || 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {e.settlement_status === 'pending'
                          ? '⏳ Pending Settlement'
                          : e.settlement_status === 'settled'
                          ? '✓ Settled to Bank'
                          : e.settlement_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeOrders.length > 0 ? (
          /* Active orders view before delivery mark */
          <div className="overflow-x-auto">
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <HiClock className="w-4 h-4 shrink-0" />
              <span>Active In-Progress Orders. Full settlement records are generated as orders are fulfilled.</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-dark-700/40">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Order Details</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Customer / Method</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Gross Amount</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Estimated Net</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/40">
                {activeOrders.map((ao, i) => {
                  const gross = Number(ao.total_amount || ao.subtotal) || 0;
                  const net = gross - Math.round(gross * 0.10);
                  return (
                    <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-white font-bold text-xs font-mono">
                          {ao.orders?.order_number || `#${ao.order_id?.substring(0, 8)}`}
                        </p>
                        <p className="text-gray-400 text-[11px]">
                          {ao.created_at ? new Date(ao.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-200 text-xs font-medium">
                          {ao.orders?.shipping_name || 'Customer'}
                        </p>
                        <span className="text-[10px] uppercase font-bold text-gold-400">
                          {ao.orders?.payment_method === 'cod' ? '💵 COD' : '⚡ Online'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-white font-semibold">
                        ₹{gross.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right text-gold-400 font-bold">
                        ₹{net.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize">
                          {ao.status || ao.orders?.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">
            <div className="text-5xl mb-3">💰</div>
            <p className="font-semibold text-white">No earnings yet</p>
            <p className="text-sm mt-1">Earnings and settlements will appear here in real-time as customers purchase your crafts.</p>
          </div>
        )}
      </div>

      {/* Settlement Info Notice */}
      <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-700 flex items-start gap-3 text-xs text-gray-400">
        <HiShieldCheck className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-gray-300">Direct Real-Time Settlement Architecture</p>
          <p>
            When customer orders are delivered, net earnings (90%) are automatically recorded and credited to your pending balance in real-time. Platform administrators process settlements directly to your registered bank account on a weekly cycle.
          </p>
        </div>
      </div>
    </div>
  );
}
