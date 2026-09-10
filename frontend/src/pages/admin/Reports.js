import React, { useEffect, useState } from 'react';
import { 
  HiExclamationCircle, 
  HiRefresh,
  HiCheckCircle,
  HiXCircle,
  HiX
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [newReport, setNewReport] = useState({
    report_type: 'product',
    target_id: '',
    reason: '',
    description: ''
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getReports();
      setReports(data || []);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const handleSync = () => {
      fetchReports();
    };
    window.addEventListener('kala:sync:reports_updated', handleSync);
    return () => window.removeEventListener('kala:sync:reports_updated', handleSync);
  }, []);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!newReport.target_id || !newReport.reason) {
      toast.error('Please specify target identifier and reason');
      return;
    }
    setSubmittingReport(true);
    try {
      const { data } = await adminAPI.createReport(newReport);
      toast.success('Report ticket filed and saved in database! 🚨');
      setReports(prev => [data, ...prev]);
      setShowNewModal(false);
      setNewReport({ report_type: 'product', target_id: '', reason: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to file report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    setUpdating(true);
    try {
      await adminAPI.updateReportStatus(id, { 
        status: nextStatus,
        admin_notes: resolutionNotes 
      });
      toast.success(`Report status updated to ${nextStatus}`);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus, admin_notes: resolutionNotes } : r));
      setSelectedReport(null);
      setResolutionNotes('');
    } catch {
      toast.error('Failed to update report status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">🟢 Resolved</span>;
      case 'under_review':
        return <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">🔵 Under Review</span>;
      case 'rejected':
        return <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">🔴 Rejected</span>;
      default:
        return <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🟡 Open</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiExclamationCircle className="text-gold-400 w-7 h-7" /> Platform Reports & Buyer Safety
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Investigate customer feedback, counterfeit complaints, or artisan dispute tickets.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg shadow-gold-500/20"
          >
            <span>🚨</span>
            <span>File New Report</span>
          </button>
          <button
            onClick={fetchReports}
            className="btn-secondary flex items-center gap-2 text-xs py-2"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Tickets
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-14 shimmer rounded-lg" />)}
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-800/80 text-gray-400 border-b border-dark-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/50">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-dark-700 text-gold-400 font-bold border border-dark-600 capitalize">
                        {r.report_type || 'Product'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {r.reason}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-gray-300 line-clamp-2 leading-relaxed">{r.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => { setSelectedReport(r); setResolutionNotes(r.admin_notes || ''); }}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Review Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto mb-2 text-xl">
              ✓
            </div>
            <p className="text-gray-300 font-medium">All Clear!</p>
            <p className="text-xs text-gray-500 mt-1">No open customer complaints or safety reports at this time.</p>
          </div>
        )}
      </div>

      {/* Modal: Resolution */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border border-dark-500">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Ticket: {selectedReport.reason}</h3>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-white">
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong className="text-gray-400">Target Type:</strong> <span className="text-gold-400 capitalize">{selectedReport.report_type}</span></p>
              <p><strong className="text-gray-400">Report Details:</strong></p>
              <div className="p-3 rounded-lg bg-dark-750 border border-dark-600 text-gray-200 leading-relaxed">
                {selectedReport.description}
              </div>
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Resolution / Action Notes:</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Record what action was taken (e.g., contacted artisan, refunded buyer)..."
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-dark-600">
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus(selectedReport.id, 'under_review')}
                className="btn-secondary text-blue-400 text-xs py-1.5 flex-1"
              >
                Under Review
              </button>
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                className="btn-primary text-xs py-1.5 flex-1"
              >
                Resolve Ticket
              </button>
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                className="btn-secondary text-red-400 text-xs py-1.5 flex-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: File New Report */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border border-gold-500/40 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-dark-600">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>🚨</span>
                <span>File Platform Safety Report</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-white">
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Report Category</label>
                <select
                  className="input-field"
                  value={newReport.report_type}
                  onChange={e => setNewReport(prev => ({ ...prev, report_type: e.target.value }))}
                >
                  <option value="product">Product (Counterfeit, Damaged, Misleading)</option>
                  <option value="artisan">Artisan (Store Issue, Disputed Claim)</option>
                  <option value="customer">Customer / Buyer (Payment Fraud)</option>
                  <option value="order">Order (Delivery Failure)</option>
                  <option value="safety">Platform Safety / Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Target ID / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product ID, Order ID, or Store Name"
                  className="input-field"
                  value={newReport.target_id}
                  onChange={e => setNewReport(prev => ({ ...prev, target_id: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counterfeit silk claim, damaged pottery, wrong dimension"
                  className="input-field"
                  value={newReport.reason}
                  onChange={e => setNewReport(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Description & Investigation Notes</label>
                <textarea
                  rows={3}
                  placeholder="Provide comprehensive details about the issue..."
                  className="input-field resize-none leading-relaxed"
                  value={newReport.description}
                  onChange={e => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-dark-600">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-secondary text-xs flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="btn-primary text-xs flex-1 py-2 font-bold shadow-lg shadow-gold-500/20"
                >
                  {submittingReport ? 'Submitting to DB...' : '💾 Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
