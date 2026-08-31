import React, { useEffect, useState } from 'react';
import { 
  HiCog, 
  HiShieldCheck, 
  HiSparkles, 
  HiCurrencyRupee, 
  HiSave,
  HiRefresh
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    platform_name: 'KalaStyle AI',
    contact_email: 'support@kalastyle.ai',
    contact_phone: '+91 7676558335',
    currency: 'INR',
    currency_symbol: '₹',
    tax_rate: 5.0,
    platform_commission: 10.0,
    ai_features_enabled: true,
    daily_ai_limit_per_artisan: 50,
    auto_approve_products: false,
    maintenance_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getSettings();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Platform settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiCog className="text-gold-400 w-7 h-7" /> Platform & Marketplace Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure marketplace commission rates, contact metadata, and AI operation limits.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reset
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. General Branding & Contact */}
        <div className="card p-6 space-y-4 border border-dark-600">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <HiShieldCheck className="text-gold-400 w-5 h-5" /> General Marketplace Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.platform_name}
                onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Support Contact Email</label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.contact_phone}
                onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Commercial & Commission Settings */}
        <div className="card p-6 space-y-4 border border-dark-600">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <HiCurrencyRupee className="text-green-400 w-5 h-5" /> Commission & Taxation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Currency Code</label>
              <input
                type="text"
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">GST / Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.tax_rate}
                onChange={e => setSettings({ ...settings, tax_rate: Number(e.target.value) })}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Platform Commission (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.platform_commission}
                onChange={e => setSettings({ ...settings, platform_commission: Number(e.target.value) })}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        {/* 3. AI Safety & Resource Allocation */}
        <div className="card p-6 space-y-4 border border-dark-600">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <HiSparkles className="text-gold-400 w-5 h-5" /> Gemini AI Engine Controls
          </h2>
          
          <div className="p-3 bg-dark-750 border border-dark-600 rounded-xl text-xs text-gray-400 flex items-start gap-2">
            <span className="text-gold-400 font-bold">🔒 Security Notice:</span>
            <span>API Keys are securely maintained in server environment variables and never exposed to the frontend.</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 border border-dark-600">
              <div>
                <p className="font-bold text-white">Enable AI Studio & Multilingual Features</p>
                <p className="text-gray-400 text-[11px]">Allows artisans to use voice input, image analysis, and automated catalog generation.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ai_features_enabled}
                onChange={e => setSettings({ ...settings, ai_features_enabled: e.target.checked })}
                className="h-5 w-5 rounded text-gold-500 bg-dark-800 border-dark-500 focus:ring-0 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">Daily AI Generation Limit per Artisan</label>
              <input
                type="number"
                value={settings.daily_ai_limit_per_artisan}
                onChange={e => setSettings({ ...settings, daily_ai_limit_per_artisan: Number(e.target.value) })}
                className="w-full sm:w-48 bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 shadow-gold"
          >
            <HiSave className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Platform Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
