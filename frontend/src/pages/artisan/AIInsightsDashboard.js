import React, { useState, useEffect } from 'react';
import { HiSparkles, HiCollection, HiShoppingBag, HiCurrencyRupee, HiRefresh } from 'react-icons/hi';
import { aiAPI, artisanAPI } from '../../services/api';

export default function AIInsightsDashboard() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await artisanAPI.getMyStats();
      setStats(data);
      return data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (statsData) => {
    const s = statsData || stats;
    if (!s) return;
    setGeneratingInsights(true);
    try {
      const { data } = await aiAPI.getInsights({ stats: s });
      setInsights(data.insights || []);
      setIsAIGenerated(data.isAIGenerated);
    } catch {
      setInsights(['Not enough data yet to generate insights. Add products and start selling to see AI-powered business insights here.']);
      setIsAIGenerated(false);
    } finally {
      setGeneratingInsights(false);
    }
  };

  useEffect(() => {
    fetchStats().then(generateInsights);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = stats ? [
    { icon: HiCollection,    label: 'Total Products', value: stats.totalProducts || 0,      color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    { icon: HiShoppingBag,   label: 'Total Orders',   value: stats.totalOrders || 0,        color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { icon: HiCurrencyRupee, label: 'Total Revenue',  value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-400/10' },
  ] : [];

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-3">
            <HiSparkles className="text-gold-400 w-7 h-7" /> AI Market Insights
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI analysis based on your real platform data — no invented statistics.</p>
        </div>
        <button
          onClick={() => generateInsights(stats)}
          disabled={generatingInsights || loading}
          className="btn-secondary flex items-center gap-2 text-sm shrink-0"
        >
          <HiRefresh className={`w-4 h-4 ${generatingInsights ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid — real data from Supabase */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card p-6 h-24 shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
              <div><p className="text-gray-400 text-sm">{s.label}</p><p className="text-2xl font-bold text-white">{s.value}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">AI Business Insights</h2>
          <div className="flex items-center gap-2">
            {isAIGenerated && (
              <span className="text-xs px-2 py-1 bg-gold-500/15 text-gold-400 border border-gold-500/30 rounded-full">Powered by Gemini AI</span>
            )}
          </div>
        </div>

        {generatingInsights ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <div className="w-5 h-5 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Analyzing your business data...</p>
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 bg-dark-700/50 border border-dark-600 rounded-xl p-4">
                <div className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <HiSparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Not enough data yet to generate insights.</p>
            <p className="text-xs mt-1">Add products and start selling to unlock AI-powered insights.</p>
          </div>
        )}

        <p className="text-gray-600 text-xs border-t border-dark-700 pt-3">
          Insights are generated from your real platform data. AI interprets trends but does not invent statistics.
        </p>
      </div>
    </div>
  );
}
