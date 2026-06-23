import React, { useState, useEffect } from 'react';
import { HiCog, HiSave, HiCheckCircle, HiRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const DEFAULT_SETTINGS = {
  storeName: 'Style Heaven',
  supportEmail: 'support@styleheaven.com',
  supportPhone: '+91 7676558335',
  storeAddress: "Style heaven men's Wear, L. E, T College Road, near Wali Complex, Gokak, Karnataka 591307",
  currency: 'INR (₹)',
  taxRate: '18',
  maintenanceMode: false,
  orderNotifications: true,
  instagramUrl: 'https://www.instagram.com/style_heaven_mens_wear?igsh=MXVueXV5ejc1bXVvNQ==',
  whatsappNumber: '917676558335',
  footerTagline: "Redefining men's fashion with premium quality fabrics, timeless designs, and unmatched elegance.",
};

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load current settings from backend on mount
  useEffect(() => {
    settingsAPI.get()
      .then(({ data }) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => toast.error('Could not load current settings'))
      .finally(() => setFetchLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSaved(false);
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsAPI.update(settings);
      // Refresh the global SettingsContext so all pages see the new values
      await refreshSettings();
      setSaved(true);
      toast.success('✅ Settings saved! All pages updated.');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Store Settings</h1>
          <p className="text-gray-400">Changes here appear live across all pages of the website.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`btn-primary flex items-center gap-2 transition-all ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <HiCheckCircle className="w-5 h-5" />
          ) : (
            <HiSave className="w-5 h-5" />
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Live update notice */}
      <div className="flex items-center gap-3 bg-gold-500/5 border border-gold-500/20 rounded-xl px-5 py-3 mb-8">
        <HiRefresh className="w-4 h-4 text-gold-400 shrink-0" />
        <p className="text-xs text-gray-400">
          <span className="text-gold-400 font-semibold">Live Sync:</span>{' '}
          Footer contact details, store name, tagline, and social links update globally when you save.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Nav */}
        <div className="hidden md:block col-span-1">
          <nav className="sticky top-24 space-y-2">
            <a href="#general"     className="block px-4 py-3 rounded-lg bg-gold-500/10 text-gold-400 font-medium border border-gold-500/20">General Information</a>
            <a href="#contact"     className="block px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors">Contact Details</a>
            <a href="#social"      className="block px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors">Social & Links</a>
            <a href="#preferences" className="block px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors">Store Preferences</a>
          </nav>
        </div>

        {/* Settings Forms */}
        <div className="col-span-1 md:col-span-2 space-y-8">

          {/* General Info */}
          <div id="general" className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-600 pb-4 flex items-center gap-2">
              <HiCog className="text-gold-400" /> General Information
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Store Name</label>
                <input
                  type="text" name="storeName" value={settings.storeName} onChange={handleChange}
                  className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                />
                <p className="text-[10px] text-gray-600 mt-1">Appears in the footer, navbar, and browser tab.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Footer Tagline</label>
                <textarea
                  name="footerTagline" value={settings.footerTagline} onChange={handleChange} rows={2}
                  className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">Short description shown in the footer below the logo.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
                  <select
                    name="currency" value={settings.currency} onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors appearance-none"
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tax Rate (%)</label>
                  <input
                    type="number" name="taxRate" value={settings.taxRate} onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div id="contact" className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-600 pb-4">Contact Details</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Support Email</label>
                  <input
                    type="email" name="supportEmail" value={settings.supportEmail} onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Support Phone</label>
                  <input
                    type="tel" name="supportPhone" value={settings.supportPhone} onChange={handleChange}
                    className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Shown in footer (with country code, e.g. +91...)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Store Physical Address</label>
                <textarea
                  name="storeAddress" value={settings.storeAddress} onChange={handleChange} rows={3}
                  className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">Used in the footer and auto-linked to Google Maps.</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div id="social" className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-600 pb-4">Social & Links</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Instagram URL</label>
                <input
                  type="url" name="instagramUrl" value={settings.instagramUrl} onChange={handleChange}
                  placeholder="https://www.instagram.com/youraccount"
                  className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp Number</label>
                <input
                  type="text" name="whatsappNumber" value={settings.whatsappNumber} onChange={handleChange}
                  placeholder="919876543210 (country code + number, no spaces)"
                  className="w-full bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                />
                <p className="text-[10px] text-gray-600 mt-1">No + or spaces. Example: 917676558335</p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div id="preferences" className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-600 pb-4">Store Preferences</h2>
            <div className="space-y-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-white font-medium mb-1 group-hover:text-gold-400 transition-colors">Order Notifications</p>
                  <p className="text-sm text-gray-500">Receive email alerts for every new order placed</p>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" name="orderNotifications" checked={settings.orderNotifications} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-white font-medium mb-1 group-hover:text-red-400 transition-colors">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">Temporarily hide the storefront from customers</p>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Save button (bottom) */}
          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full btn-primary py-4 flex items-center justify-center gap-2 text-base ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <HiCheckCircle className="w-5 h-5" />
            ) : (
              <HiSave className="w-5 h-5" />
            )}
            {saved ? 'All Pages Updated!' : 'Save & Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
