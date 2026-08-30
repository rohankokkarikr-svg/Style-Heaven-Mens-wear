import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';
import { HiQrcode, HiCheckCircle, HiPhotograph } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Signup() {
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [artisanType, setArtisanType] = useState('Weaver');
  const [upiId, setUpiId] = useState('');
  const [upiQrCode, setUpiQrCode] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [loading, setLoading] = useState(false);
  const qrInputRef = useRef();
  const { signup } = useAuth();
  const navigate = useNavigate();

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
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await productAPI.uploadDirect(fd);
      if (data?.imageUrl) {
        setUpiQrCode(data.imageUrl);
        toast.success('UPI QR Code uploaded directly to Cloudinary! ☁️✨', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to upload QR Code image', { id: toastId });
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) { toast.error('Please enter a valid 10-digit mobile number'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (role === 'artisan' && !storeName.trim()) { toast.error('Please enter your store name'); return; }
    setLoading(true);
    try {
      await signup(name, cleanPhone, password, role, storeName || name, artisanType, upiId.trim(), upiQrCode);
      navigate(role === 'artisan' ? '/artisan' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 card p-8">
        <div>
          <div className="flex justify-center mb-4">
            <img
              src="/images/kalastyle_logo.png"
              alt="KalaStyle AI"
              className="h-16 w-16 object-cover rounded-full ring-2 ring-gold-500/80 shadow-gold"
            />
          </div>
          <h2 className="text-center text-3xl font-serif font-bold text-white">Join KalaStyle AI</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Create your <span className="gold-text font-medium">KalaStyle AI</span> account
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-dark-400">
          <button type="button" onClick={() => setRole('user')}
            className={"flex-1 py-2.5 text-sm font-medium transition-all " + (role === 'user' ? 'bg-gold-500 text-dark-900' : 'bg-dark-700 text-gray-400 hover:text-white')}>
            🛍️ I'm a Customer
          </button>
          <button type="button" onClick={() => setRole('artisan')}
            className={"flex-1 py-2.5 text-sm font-medium transition-all " + (role === 'artisan' ? 'bg-gold-500 text-dark-900' : 'bg-dark-700 text-gray-400 hover:text-white')}>
            🎨 I'm an Artisan
          </button>
        </div>

        {role === 'artisan' && (
          <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-3 text-sm text-gold-400">
            🌟 <strong>Artisan Benefits:</strong> Access AI Product Studio, list handmade crafts, and receive direct customer UPI payments!
          </div>
        )}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input id="signup-name" name="name" type="text" required className="input-field" placeholder="Full Name"
              value={name} onChange={(e) => setName(e.target.value)} />
            <input id="signup-phone" name="phone" type="tel" maxLength="10" required className="input-field"
              placeholder="Phone Number (10 digits)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
            <input id="signup-password" name="password" type="password" required className="input-field"
              placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />

            {role === 'artisan' && (
              <>
                <input id="store-name" name="store_name" type="text" required className="input-field"
                  placeholder="Your Store / Shop Name (e.g. Lakshmi Handlooms)"
                  value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                <select id="artisan-type" value={artisanType} onChange={(e) => setArtisanType(e.target.value)} className="input-field">
                  <option value="Weaver">Weaver / Handloom</option>
                  <option value="Tailor">Tailor / Clothing Maker</option>
                  <option value="Jewelry Maker">Jewelry Maker</option>
                  <option value="Embroidery Artist">Embroidery Artist</option>
                  <option value="Bag Maker">Bag Maker</option>
                  <option value="General">General Artisan</option>
                </select>

                {/* Artisan UPI Payment Configuration */}
                <div className="p-4 rounded-xl bg-dark-700/60 border border-gold-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <HiQrcode className="w-5 h-5 text-gold-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Your Payment QR Code / UPI</h4>
                      <p className="text-[11px] text-gray-400">Customers will scan this QR to pay you directly on checkout!</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-300 font-semibold mb-1">UPI ID / VPA (Optional)</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-300 font-semibold mb-1">UPI QR Code Image (Recommended)</label>
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrUpload}
                    />
                    
                    {upiQrCode ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-800 border border-green-500/40">
                        <img src={upiQrCode} alt="QR Preview" className="w-12 h-12 rounded object-contain bg-white p-0.5 border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-green-400 flex items-center gap-1">
                            <HiCheckCircle className="w-4 h-4" /> QR Code Uploaded!
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">Saved directly to Cloudinary</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => qrInputRef.current?.click()}
                          className="text-xs text-gold-400 hover:text-gold-300 underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        disabled={uploadingQr}
                        className="w-full py-2.5 px-3 border border-dashed border-gold-500/50 hover:border-gold-400 rounded-lg bg-dark-800/80 text-xs text-gold-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <HiPhotograph className="w-4 h-4 text-gold-400" />
                        {uploadingQr ? 'Uploading to Cloudinary ☁️...' : '📷 Upload UPI QR Code Image (PhonePe/GPay/Paytm)'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={loading || uploadingQr} className="w-full btn-primary">
            {loading ? 'Creating...' : role === 'artisan' ? '🎨 Create Artisan Account' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
