import React, { useEffect, useState } from 'react';
import { 
  HiSparkles, 
  HiCheckCircle, 
  HiXCircle, 
  HiPencil, 
  HiFlag, 
  HiRefresh,
  HiCollection,
  HiLightningBolt,
  HiCheck
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AIManagement() {
  const [aiProducts, setAiProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAIData = async () => {
    setLoading(true);
    try {
      const [contentRes, statsRes, logsRes] = await Promise.allSettled([
        adminAPI.getAIContent(),
        adminAPI.getAIStats(),
        adminAPI.getAILogs()
      ]);
      
      let hasData = false;
      if (contentRes.status === 'fulfilled') {
        setAiProducts(contentRes.value.data || []);
        hasData = true;
      } else {
        console.warn('AI content fetch rejected:', contentRes.reason);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data || null);
        hasData = true;
      } else {
        console.warn('AI stats fetch rejected:', statsRes.reason);
      }

      if (logsRes.status === 'fulfilled') {
        setLogs(logsRes.value.data || []);
      }

      if (!hasData && contentRes.status === 'rejected') {
        const err = contentRes.reason;
        const msg = err.response?.data?.error || err.message || 'Failed to load AI operations data';
        toast.error(msg);
      }
    } catch (err) {
      console.error('Fetch AI Data error:', err);
      toast.error('Failed to load AI operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveProduct(id);
      toast.success('AI Catalog item approved!');
      setAiProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleFlag = async (id) => {
    try {
      await adminAPI.rejectProduct(id, { reason: 'Flagged by Admin during AI Review for manual revision' });
      toast.success('AI item flagged for review');
      setAiProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    } catch {
      toast.error('Failed to flag');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiSparkles className="text-gold-400 w-7 h-7" /> AI Operations & Quality Review Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Audit Gemini AI-generated catalogs, track inference volume, and ensure cultural fidelity.
          </p>
        </div>
        <button
          onClick={fetchAIData}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* AI Usage Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-gold-500">
          <p className="text-xs font-semibold text-gray-400">Total AI Inferences</p>
          <p className="text-2xl font-bold text-white mt-1">{stats?.totalRequests || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Powered by {stats?.modelUsed || 'gemini-2.0-flash'}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-green-500">
          <p className="text-xs font-semibold text-gray-400">Smart Catalogs Created</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats?.catalogsGenerated || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Published by artisans</p>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-gray-400">Translations & Multi-lang</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats?.translationsDone || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Hindi, Kannada, Marathi</p>
        </div>
        <div className="card p-5 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-gray-400">Price Estimations</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats?.priceSuggestions || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Cost calculations served</p>
        </div>
      </div>

      {/* AI Content Review List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>AI Catalog Submissions for Quality Audit</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30">
              {aiProducts.length} items
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="card h-48 shimmer" />)}
          </div>
        ) : aiProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiProducts.map(p => (
              <div key={p.id} className="card p-5 space-y-3.5 border border-dark-600 hover:border-gold-500/40 transition-colors">
                <div className="flex gap-3.5 items-start">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200'}
                    alt={p.name}
                    className="w-20 h-20 rounded-xl object-cover ring-1 ring-gold-500/50 shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200';
                    }}
                  />
                  <div className="flex-1 overflow-hidden space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 font-bold border border-gold-500/30">
                        🤖 AI Generated
                      </span>
                      <span className="text-xs font-bold text-white">₹{p.price}</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm truncate">{p.name}</h3>
                    <p className="text-gray-400 text-xs truncate">
                      {p.category} • {p.artisan_profiles?.store_name || 'Artisan'}
                    </p>
                  </div>
                </div>

                {/* AI Generated Description */}
                <div className="p-3 bg-dark-750 rounded-xl border border-dark-600 text-xs text-gray-300 space-y-1">
                  <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">AI Generated Description:</p>
                  <p className="line-clamp-3 leading-relaxed">{p.description || 'No description'}</p>
                </div>

                {/* Tags & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dark-600/60 text-xs">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(Array.isArray(p.tags) ? p.tags : []).slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => handleFlag(p.id)}
                      className="px-2.5 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1 text-[11px]"
                      title="Flag for revision"
                    >
                      <HiFlag className="w-3.5 h-3.5" /> Flag
                    </button>
                    {p.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="px-2.5 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <HiCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-gray-500 text-sm">
            <HiSparkles className="w-12 h-12 mx-auto mb-3 opacity-30 text-gold-400" />
            <p>No AI catalog listings requiring review at this time.</p>
          </div>
        )}
      </div>

      {/* Database Audit: Real-Time AI Inference Logs Table */}
      <div className="space-y-4 pt-4 border-t border-dark-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Database Audit: Live AI Inference Logs (`ai_usage_logs`)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              {logs.length} logged
            </span>
          </h2>
        </div>

        <div className="card overflow-hidden">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-800/80 text-gray-400 border-b border-dark-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Prompt Chars</th>
                    <th className="py-3 px-4">Response Chars</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600/50">
                  {logs.slice(0, 20).map((l, i) => (
                    <tr key={l.id || i} className="hover:bg-dark-700/30 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-gold-400 capitalize">
                        {l.feature?.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-4 text-gray-300 font-mono text-[11px]">
                        {l.model}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">
                        {l.prompt_length || 0}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">
                        {l.response_length || 0}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs">
              No AI inference logs stored in database yet. Generate a story or analyze a product to record your first log!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
