import React, { useEffect, useState } from 'react';
import { 
  HiClipboardList, 
  HiRefresh,
  HiUser,
  HiTag,
  HiClock
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getActivityLogs();
      setLogs(data || []);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiClipboardList className="text-gold-400 w-7 h-7" /> Admin Activity Audit Trail
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Tamper-evident logs of administrative actions, status updates, and platform modifications.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Trail
        </button>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 shimmer rounded-lg" />)}
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-800/80 text-gray-400 border-b border-dark-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Admin Performer</th>
                  <th className="py-3 px-4">Action Taken</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/50">
                {logs.map((l, idx) => (
                  <tr key={idx} className="hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <div className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {l.admin_name ? l.admin_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span className="truncate">{l.admin_name || 'System Admin'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gold-300">
                      {l.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-dark-700 text-gray-300 border border-dark-600 font-medium text-[11px]">
                        {l.target_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">
                      {l.target_id ? l.target_id.slice(0, 12) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 text-[11px]">
                      {l.created_at ? new Date(l.created_at).toLocaleString('en-IN') : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            No admin activity records logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
