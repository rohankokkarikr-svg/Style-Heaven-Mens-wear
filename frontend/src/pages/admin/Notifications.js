import React, { useEffect, useState } from 'react';
import { 
  HiBell, 
  HiPaperAirplane, 
  HiUsers, 
  HiUserGroup, 
  HiRefresh,
  HiEye,
  HiX
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getNotifications();
      setNotifications(data || []);
    } catch {
      toast.error('Failed to load notifications history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }
    setSending(true);
    try {
      await adminAPI.sendNotification({
        title,
        message,
        target_audience: targetAudience,
      });
      toast.success('Notification broadcasted successfully!');
      setTitle('');
      setMessage('');
      setPreviewOpen(false);
      fetchNotifications();
    } catch {
      toast.error('Failed to broadcast notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiBell className="text-gold-400 w-7 h-7" /> Platform Broadcast & Notifications
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Send platform-wide announcements, policy updates, or festival promotional notices.
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh History
        </button>
      </div>

      {/* Grid: Send Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Creator Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSend} className="card p-6 space-y-4 border border-dark-600">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <HiPaperAirplane className="text-gold-400 w-4 h-4 rotate-90" /> Broadcast New Message
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="all">🌍 All Users (Artisans + Customers)</option>
                  <option value="artisans">👨‍🎨 Artisans Only</option>
                  <option value="customers">👥 Customers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Notification Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Diwali Artisan Fair is Now Live!"
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500 resize-none leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-dark-600">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={!title || !message}
                className="btn-secondary text-xs py-2 px-3 flex-1 flex items-center justify-center gap-1"
              >
                <HiEye className="w-4 h-4" /> Preview
              </button>
              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="btn-primary text-xs py-2 px-4 flex-1 flex items-center justify-center gap-1"
              >
                <HiPaperAirplane className="w-4 h-4 rotate-90" /> {sending ? 'Sending...' : 'Broadcast'}
              </button>
            </div>
          </form>
        </div>

        {/* Sent Notifications History */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <h2 className="font-bold text-white text-base">Broadcast History & Sent Logs</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 shimmer rounded-lg" />)}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
              {notifications.map((n, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-dark-750 border border-dark-600/70 space-y-2 hover:border-gold-500/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-white text-sm truncate">{n.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-dark-700 text-gold-400 border border-dark-600 capitalize font-medium shrink-0">
                      {n.target_audience === 'all' ? 'All Users' : n.target_audience}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-500 pt-1">
                    Sent on {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : 'Recently'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-xs">
              No notifications broadcasted yet.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Message Preview */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border border-gold-500/50 shadow-gold/20 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gold-400 text-sm">Notification Preview (As Seen by Users)</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-white">
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-dark-750 border border-dark-600 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-gold-500/20 text-gold-400">
                  <HiBell className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">{title || 'Notification Title'}</h4>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">{message || 'Your notification message...'}</p>
            </div>
            <button onClick={() => setPreviewOpen(false)} className="btn-secondary w-full text-xs py-2">
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
