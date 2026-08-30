import React, { useEffect, useState } from 'react';
import { artisanAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { HiCheck, HiX, HiExternalLink } from 'react-icons/hi';

const STATUS_STYLE = { verified: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400', pending: 'bg-yellow-500/20 text-yellow-400' };

export default function AdminArtisans() {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    artisanAPI.getAllAdmin().then(({ data }) => { setArtisans(data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await artisanAPI.verify(id, { verification_status: status });
      setArtisans(prev => prev.map(a => a.id === id ? { ...a, verification_status: status } : a));
      toast.success('Artisan status updated to ' + status + '!');
    } catch { toast.error('Failed to update status'); }
  };

  const filtered = filter === 'all' ? artisans : artisans.filter(a => a.verification_status === filter);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-serif font-bold text-white">Artisan Management</h1><p className="text-gray-400 text-sm mt-1">{artisans.length} total artisans registered</p></div>
      <div className="flex gap-2 flex-wrap">
        {['all','pending','verified','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ' + (filter === f ? 'bg-gold-500 text-dark-900' : 'bg-dark-700 text-gray-400 hover:text-white')}>{f} {f !== 'all' && ('(' + artisans.filter(a => a.verification_status === f).length + ')')}</button>
        ))}
      </div>
      <div className="card overflow-hidden">
        {loading ? <div className="p-8 shimmer h-40" /> : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-dark-700 text-gray-400 text-left"><th className="px-4 py-3">Artisan</th><th className="px-4 py-3">Store Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-dark-600 hover:bg-dark-700/40">
                    <td className="px-4 py-3">
                      <div><p className="text-white font-medium">{a.users?.name || 'N/A'}</p><p className="text-gray-500 text-xs">{a.users?.email}</p></div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-medium">{a.store_name}</td>
                    <td className="px-4 py-3 text-gray-400">{a.artisan_type || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{a.location || '-'}</td>
                    <td className="px-4 py-3"><span className={'badge ' + (STATUS_STYLE[a.verification_status] || 'bg-gray-500/20 text-gray-400')}>{a.verification_status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {a.verification_status !== 'verified' && <button onClick={() => handleVerify(a.id, 'verified')} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-all" title="Verify"><HiCheck className="w-4 h-4" /></button>}
                        {a.verification_status !== 'rejected' && <button onClick={() => handleVerify(a.id, 'rejected')} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all" title="Reject"><HiX className="w-4 h-4" /></button>}
                        <a href={'/artisans/' + a.id} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-dark-600 text-gray-400 hover:text-gold-400 rounded-lg transition-all" title="View Store"><HiExternalLink className="w-4 h-4" /></a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-center py-12 text-gray-500"><div className="text-4xl mb-3">🎨</div><p>No {filter !== 'all' ? filter : ''} artisans found.</p></div>}
      </div>
    </div>
  );
}
