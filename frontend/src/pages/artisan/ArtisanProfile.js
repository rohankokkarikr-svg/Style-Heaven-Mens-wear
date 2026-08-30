import React, { useEffect, useState } from 'react';
import { artisanAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali'];
const ARTISAN_TYPES = ['Weaver / Handloom', 'Tailor / Clothing Maker', 'Jewelry Maker', 'Embroidery Artist', 'Bag Maker', 'General Artisan'];

export default function ArtisanProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    artisanAPI.getMyProfile().then(({ data }) => {
      setProfile(data); setForm(data); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await artisanAPI.updateProfile(form);
      setProfile(data); toast.success('Profile updated successfully!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const field = (key) => form[key] || '';
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return <div className="card p-12 text-center"><div className="shimmer h-8 w-48 mx-auto rounded" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-serif font-bold text-white">Artisan Profile</h1><p className="text-gray-400 text-sm mt-1">Update your store information and artisan details</p></div>
      {profile?.verification_status && (
        <div className={'border rounded-xl p-4 flex items-center gap-3 ' + (profile.verification_status === 'verified' ? 'border-green-500/30 bg-green-500/10' : profile.verification_status === 'rejected' ? 'border-red-500/30 bg-red-500/10' : 'border-yellow-500/30 bg-yellow-500/10')}>
          <span className="text-2xl">{profile.verification_status === 'verified' ? '✅' : profile.verification_status === 'rejected' ? '❌' : '⏳'}</span>
          <div>
            <p className="font-semibold text-white capitalize">{profile.verification_status} Artisan</p>
            <p className="text-sm text-gray-400">{profile.verification_status === 'verified' ? 'Your store is verified! Customers can see your artisan badge.' : profile.verification_status === 'rejected' ? 'Your verification was rejected. Please contact support.' : 'Your account is pending admin verification.'}</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Store Name *</label><input className="input-field" value={field('store_name')} onChange={e => set('store_name', e.target.value)} placeholder="e.g. Lakshmi Handlooms" required /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Artisan Type</label><select className="input-field" value={field('artisan_type')} onChange={e => set('artisan_type', e.target.value)}>{ARTISAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Specialization</label><input className="input-field" value={field('specialization')} onChange={e => set('specialization', e.target.value)} placeholder="e.g. Handwoven Silk Sarees" /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Location</label><input className="input-field" value={field('location')} onChange={e => set('location', e.target.value)} placeholder="e.g. Mysore, Karnataka" /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">About Your Store / Bio</label><textarea rows={4} className="input-field resize-none" value={field('bio')} onChange={e => set('bio', e.target.value)} placeholder="Tell customers about your craft, your story, and what makes your products special..." /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Preferred Language (for AI features)</label><select className="input-field" value={field('preferred_language') || 'English'} onChange={e => set('preferred_language', e.target.value)}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Profile'}</button>
      </form>
    </div>
  );
}
