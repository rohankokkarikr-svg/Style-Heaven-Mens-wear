import React, { useEffect, useState, useRef } from 'react';
import { artisanAPI, productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiCamera, HiPhotograph, HiCheckCircle, HiQrcode } from 'react-icons/hi';
import toast from 'react-hot-toast';

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali'];
const ARTISAN_TYPES = ['Weaver / Handloom', 'Tailor / Clothing Maker', 'Jewelry Maker', 'Embroidery Artist', 'Bag Maker', 'General Artisan'];

export default function ArtisanProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const fileInputRef = useRef();
  const qrInputRef = useRef();

  const fetchProfile = () => {
    artisanAPI.getMyProfile().then(({ data }) => {
      if (data) {
        setProfile(data); setForm(data || {}); setLoading(false);
      }
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Real-time listener: immediately update profile banner when Admin verifies
  useEffect(() => {
    const handleSync = (e) => {
      const payload = e.detail?.payload;
      if (payload?.verification_status) {
        setProfile(prev => prev ? { ...prev, verification_status: payload.verification_status } : prev);
        fetchProfile();
      }
    };
    window.addEventListener('kala:sync:artisans_updated', handleSync);
    return () => window.removeEventListener('kala:sync:artisans_updated', handleSync);
  }, []);

  // Client-side image compression: ensures quick uploads under any network conditions
  const processImageFile = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        return resolve({ blob: file, dataUrl: null });
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          canvas.toBlob((blob) => {
            resolve({ blob: blob || file, dataUrl });
          }, 'image/jpeg', 0.88);
        };
        img.onerror = () => resolve({ blob: file, dataUrl: e.target.result });
        img.src = e.target.result;
      };
      reader.onerror = () => resolve({ blob: file, dataUrl: null });
      reader.readAsDataURL(file);
    });
  };

  const uploadImageSmart = async (file) => {
    const { blob, dataUrl } = await processImageFile(file);
    try {
      const fd = new FormData();
      fd.append('image', blob, file.name ? file.name.replace(/\.[^/.]+$/, ".jpg") : 'upload.jpg');
      const { data } = await productAPI.uploadDirect(fd);
      if (data?.imageUrl) return data.imageUrl;
    } catch (multerErr) {
      console.warn('FormData direct upload failed, trying base64 fallback...', multerErr);
      if (dataUrl) {
        const { data } = await productAPI.uploadDirect({ image: dataUrl });
        if (data?.imageUrl) return data.imageUrl;
      }
      throw multerErr;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingImg(true);
    const toastId = toast.loading('Uploading profile picture to Cloudinary ☁️...');
    try {
      const uploadedUrl = await uploadImageSmart(file);
      if (uploadedUrl) {
        set('profile_image', uploadedUrl);
        const updatedForm = { ...form, profile_image: uploadedUrl };
        await artisanAPI.updateProfile(updatedForm);
        setProfile(p => ({ ...p, profile_image: uploadedUrl }));
        toast.success('Profile photo uploaded and saved directly! ☁️✨', { id: toastId });
      }
    } catch (err) {
      console.error('Profile photo upload error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to upload image to Cloudinary';
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file of your UPI QR code');
      return;
    }

    setUploadingQr(true);
    const toastId = toast.loading('Uploading UPI QR Code to Cloudinary ☁️...');
    try {
      const uploadedUrl = await uploadImageSmart(file);
      if (uploadedUrl) {
        set('upi_qr_code', uploadedUrl);
        const updatedForm = { ...form, upi_qr_code: uploadedUrl };
        await artisanAPI.updateProfile(updatedForm);
        setProfile(p => ({ ...p, upi_qr_code: uploadedUrl }));
        toast.success('UPI QR Code saved directly to Cloudinary! ☁️✨', { id: toastId });
      }
    } catch (err) {
      console.error('QR code upload error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to upload QR code to Cloudinary';
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploadingQr(false);
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };


  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await artisanAPI.updateProfile(form);
      setProfile(data); toast.success('Profile and UPI settings updated successfully! 🎉');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const field = (key) => form[key] || '';
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return <div className="card p-12 text-center"><div className="shimmer h-8 w-48 mx-auto rounded" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-serif font-bold text-white">Artisan Profile</h1><p className="text-gray-400 text-sm mt-1">Update your store information, craft details, and UPI payment settings</p></div>
      {profile?.verification_status && (
        <div className={'border rounded-xl p-4 flex items-center gap-3 ' + (profile.verification_status === 'verified' ? 'border-green-500/30 bg-green-500/10' : profile.verification_status === 'rejected' ? 'border-red-500/30 bg-red-500/10' : 'border-yellow-500/30 bg-yellow-500/10')}>
          <span className="text-2xl">{profile.verification_status === 'verified' ? '✅' : profile.verification_status === 'rejected' ? '❌' : '⏳'}</span>
          <div>
            <p className="font-semibold text-white capitalize">{profile.verification_status} Artisan</p>
            <p className="text-sm text-gray-400">{profile.verification_status === 'verified' ? 'Your store is verified! Customers can see your artisan badge and pay you directly.' : profile.verification_status === 'rejected' ? 'Your verification was rejected. Please contact support.' : 'Your account is pending admin verification.'}</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        {/* Profile Image & Cloudinary Storage */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-dark-700/50 border border-dark-600">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-dark-800 border-2 border-gold-500/50 flex-shrink-0">
            {field('profile_image') ? (
              <img src={field('profile_image')} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🧑‍🎨</div>
            )}
            {uploadingImg && (
              <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Artisan Profile / Store Photo</h4>
            <p className="text-xs text-gray-400 mb-2">Stored permanently on Cloudinary ☁️</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImg}
              className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <HiCamera className="w-4 h-4" /> {uploadingImg ? 'Uploading...' : 'Upload to Cloudinary'}
            </button>
          </div>
        </div>

        {/* UPI Payment Settings Card */}
        <div className="p-5 rounded-2xl bg-dark-700/60 border border-gold-500/40 space-y-4 shadow-lg shadow-gold/5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-dark-600">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <HiQrcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Artisan UPI & Direct Payment QR</h3>
              <p className="text-xs text-gray-400">When customers buy your products via UPI/Online payment, this QR code is shown directly on their screen!</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-300 font-semibold mb-1 uppercase tracking-wider">Your UPI ID (VPA)</label>
            <input
              className="input-field font-mono"
              value={field('upi_id')}
              onChange={e => set('upi_id', e.target.value)}
              placeholder="e.g. yourshop@okhdfcbank or 9876543210@paytm"
            />
            <p className="text-[11px] text-gray-500 mt-1">Used to generate instant UPI payment links for PhonePe, Google Pay, and Paytm.</p>
          </div>

          <div>
            <label className="block text-xs text-gray-300 font-semibold mb-1 uppercase tracking-wider">Your Official UPI QR Code Image</label>
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrUpload}
            />

            {field('upi_qr_code') ? (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-dark-800 border border-green-500/40">
                <img
                  src={field('upi_qr_code')}
                  alt="UPI QR Code"
                  className="w-16 h-16 rounded-lg object-contain bg-white p-1 border shadow"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-400 flex items-center gap-1">
                    <HiCheckCircle className="w-4 h-4" /> Active on Customer Checkout!
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">Cloudinary URL: {field('upi_qr_code')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={uploadingQr}
                  className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <HiPhotograph className="w-4 h-4" /> Change QR
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => qrInputRef.current?.click()}
                disabled={uploadingQr}
                className="w-full py-4 px-4 border border-dashed border-gold-500/50 hover:border-gold-400 rounded-xl bg-dark-800/80 text-xs text-gold-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <HiPhotograph className="w-5 h-5 text-gold-400" />
                {uploadingQr ? 'Uploading QR Code to Cloudinary ☁️...' : '📷 Upload Your PhonePe / GPay / Paytm QR Code Image'}
              </button>
            )}
          </div>
        </div>

        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Store Name *</label><input className="input-field" value={field('store_name')} onChange={e => set('store_name', e.target.value)} placeholder="e.g. Lakshmi Handlooms" required /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Artisan Type</label><select className="input-field" value={field('artisan_type')} onChange={e => set('artisan_type', e.target.value)}>{ARTISAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Specialization</label><input className="input-field" value={field('specialization')} onChange={e => set('specialization', e.target.value)} placeholder="e.g. Handwoven Silk Sarees" /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Location</label><input className="input-field" value={field('location')} onChange={e => set('location', e.target.value)} placeholder="e.g. Mysore, Karnataka" /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">About Your Store / Bio</label><textarea rows={4} className="input-field resize-none" value={field('bio')} onChange={e => set('bio', e.target.value)} placeholder="Tell customers about your craft, your story, and what makes your products special..." /></div>
        <div><label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Preferred Language (for AI features)</label><select className="input-field" value={field('preferred_language') || 'English'} onChange={e => set('preferred_language', e.target.value)}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
        <button type="submit" disabled={saving || uploadingImg || uploadingQr} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Profile & UPI Settings'}</button>
      </form>
    </div>
  );
}

