import React, { useEffect, useState } from 'react';
import {
  HiTruck,
  HiCurrencyRupee,
  HiShieldCheck,
  HiSave,
  HiRefresh,
  HiCheckCircle,
  HiSparkles,
  HiInformationCircle,
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ShippingCost() {
  const [shippingConfig, setShippingConfig] = useState({
    delivery_fee: 50,
    free_delivery_above: 500,
    shipping_estimated_days: '3 - 5 Business Days',
    cod_enabled: true,
    cod_min_order_value: 100,
    cod_max_order_value: 5000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current platform shipping settings
  const fetchShippingConfig = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getSettings();
      if (data) {
        setShippingConfig({
          delivery_fee: data.delivery_fee !== undefined ? Number(data.delivery_fee) : 50,
          free_delivery_above: data.free_delivery_above !== undefined ? Number(data.free_delivery_above) : 500,
          shipping_estimated_days: data.shipping_estimated_days || '3 - 5 Business Days',
          cod_enabled: data.cod_enabled !== undefined ? Boolean(data.cod_enabled) : true,
          cod_min_order_value: data.cod_min_order_value !== undefined ? Number(data.cod_min_order_value) : 100,
          cod_max_order_value: data.cod_max_order_value !== undefined ? Number(data.cod_max_order_value) : 5000,
        });
      }
    } catch (err) {
      console.error('Failed to fetch shipping settings:', err);
      toast.error('Failed to load shipping cost configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingConfig();
  }, []);

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateSettings({
        delivery_fee: Number(shippingConfig.delivery_fee) || 0,
        free_delivery_above: Number(shippingConfig.free_delivery_above) || 0,
        shipping_estimated_days: shippingConfig.shipping_estimated_days,
        cod_enabled: Boolean(shippingConfig.cod_enabled),
        cod_min_order_value: Number(shippingConfig.cod_min_order_value) || 0,
        cod_max_order_value: Number(shippingConfig.cod_max_order_value) || 0,
      });

      toast.success('Shipping costs and delivery rules saved successfully! 🚚');
    } catch (err) {
      console.error('Failed to save shipping cost:', err);
      toast.error('Failed to update shipping cost settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-600/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-gold shadow-gold/5">
              <HiTruck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-wide flex items-center gap-2">
                Shipping Cost & Delivery Management
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                Configure customer shipping rates, free delivery order thresholds, and Cash on Delivery rules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold rounded-full">
            <HiShieldCheck className="w-4 h-4" /> Admin Exclusive Access
          </span>
          <button
            type="button"
            onClick={fetchShippingConfig}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-gradient-to-r from-dark-800 via-dark-800 to-dark-750 border border-gold-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-gold-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gold-400">
              Live Customer Checkout Preview
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">Real-time dynamic rule preview</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Below threshold */}
          <div className="bg-dark-900/80 border border-dark-600 p-4 rounded-xl space-y-2">
            <p className="text-gray-400 font-semibold">Standard Order (&lt; ₹{shippingConfig.free_delivery_above})</p>
            <p className="text-gray-300">Cart Total: ₹350</p>
            <div className="flex justify-between items-center pt-2 border-t border-dark-700">
              <span className="text-gray-400">Shipping Fee:</span>
              <span className="text-gold-400 font-bold text-sm">₹{shippingConfig.delivery_fee}</span>
            </div>
          </div>

          {/* Above threshold */}
          <div className="bg-dark-900/80 border border-green-500/30 p-4 rounded-xl space-y-2">
            <p className="text-green-400 font-semibold flex items-center gap-1">
              <HiCheckCircle className="w-4 h-4" /> Free Delivery (≥ ₹{shippingConfig.free_delivery_above})
            </p>
            <p className="text-gray-300">Cart Total: ₹{Math.max(shippingConfig.free_delivery_above, 500)}</p>
            <div className="flex justify-between items-center pt-2 border-t border-dark-700">
              <span className="text-gray-400">Shipping Fee:</span>
              <span className="text-green-400 font-bold text-sm">FREE (₹0)</span>
            </div>
          </div>

          {/* Estimated time */}
          <div className="bg-dark-900/80 border border-dark-600 p-4 rounded-xl space-y-2">
            <p className="text-gray-400 font-semibold">Delivery Time Badge</p>
            <p className="text-white font-medium">{shippingConfig.shipping_estimated_days}</p>
            <div className="flex justify-between items-center pt-2 border-t border-dark-700">
              <span className="text-gray-400">COD Available:</span>
              <span className={shippingConfig.cod_enabled ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {shippingConfig.cod_enabled ? 'Yes (Active)' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Core Shipping Rates */}
        <div className="card p-6 space-y-5 border border-dark-600">
          <div className="flex items-center gap-2 border-b border-dark-600 pb-3">
            <HiCurrencyRupee className="w-5 h-5 text-gold-400" />
            <h2 className="font-bold text-white text-base">Standard Shipping & Threshold Rates</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <label className="block text-gray-300 font-semibold">
                Base Shipping Cost (₹) <span className="text-gold-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={shippingConfig.delivery_fee}
                  onChange={(e) =>
                    setShippingConfig({
                      ...shippingConfig,
                      delivery_fee: Number(e.target.value),
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-500 rounded-xl p-2.5 pl-8 text-white font-bold text-sm focus:outline-none focus:border-gold-500 transition-colors"
                  required
                />
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Standard flat shipping fee applied to customer orders below the free delivery limit.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-300 font-semibold">
                Free Delivery Threshold (₹) <span className="text-gold-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={shippingConfig.free_delivery_above}
                  onChange={(e) =>
                    setShippingConfig({
                      ...shippingConfig,
                      free_delivery_above: Number(e.target.value),
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-500 rounded-xl p-2.5 pl-8 text-white font-bold text-sm focus:outline-none focus:border-gold-500 transition-colors"
                  required
                />
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Orders with cart subtotal reaching or exceeding this amount automatically qualify for 100% Free Shipping.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-gray-300 font-semibold text-xs">
              Estimated Delivery Time Label <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={shippingConfig.shipping_estimated_days}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  shipping_estimated_days: e.target.value,
                })
              }
              placeholder="e.g. 3 - 5 Business Days"
              className="w-full sm:w-80 bg-dark-700 border border-dark-500 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-gold-500"
              required
            />
            <p className="text-gray-500 text-[11px]">
              Customer-facing promise shown during product view, cart breakdown, and checkout steps.
            </p>
          </div>
        </div>

        {/* 2. Cash on Delivery (COD) Rules */}
        <div className="card p-6 space-y-5 border border-dark-600">
          <div className="flex items-center gap-2 border-b border-dark-600 pb-3">
            <HiShieldCheck className="w-5 h-5 text-gold-400" />
            <h2 className="font-bold text-white text-base">Cash on Delivery (COD) Shipping Rules</h2>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-dark-700/50 border border-dark-600 rounded-xl">
            <div>
              <p className="font-bold text-white text-xs">Enable Cash on Delivery (COD)</p>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Allow customers to select Cash on Delivery at checkout and pay when the artisan package is handed over.
              </p>
            </div>
            <input
              type="checkbox"
              checked={shippingConfig.cod_enabled}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  cod_enabled: e.target.checked,
                })
              }
              className="h-5 w-5 rounded text-gold-500 bg-dark-800 border-dark-500 focus:ring-0 cursor-pointer"
            />
          </div>

          {shippingConfig.cod_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-2">
              <div className="space-y-1.5">
                <label className="block text-gray-300 font-semibold">Minimum Order Value for COD (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={shippingConfig.cod_min_order_value}
                    onChange={(e) =>
                      setShippingConfig({
                        ...shippingConfig,
                        cod_min_order_value: Number(e.target.value),
                      })
                    }
                    className="w-full bg-dark-700 border border-dark-500 rounded-xl p-2.5 pl-8 text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>
                <p className="text-gray-500 text-[11px]">Orders below this value must pay online via Razorpay.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-300 font-semibold">Maximum Order Value for COD (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={shippingConfig.cod_max_order_value}
                    onChange={(e) =>
                      setShippingConfig({
                        ...shippingConfig,
                        cod_max_order_value: Number(e.target.value),
                      })
                    }
                    className="w-full bg-dark-700 border border-dark-500 rounded-xl p-2.5 pl-8 text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>
                <p className="text-gray-500 text-[11px]">High-value carts above this cap require secure online pre-payment.</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-dark-800/80 border border-dark-600 rounded-2xl flex items-start gap-3 text-xs text-gray-400">
          <HiInformationCircle className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Strict Admin Permission:</strong> Only authenticated platform administrators can access and alter these values. Any modifications made here instantly re-synchronize with the backend pricing calculation engine and checkout totals.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm py-3 px-8 flex items-center gap-2 shadow-gold cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <HiSave className="w-4 h-4" /> Save Shipping Cost Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
