import React, { useState } from 'react';
import { HiSparkles, HiCurrencyRupee, HiInformationCircle } from 'react-icons/hi';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AIPriceSuggestion() {
  const [inputs, setInputs] = useState({ rawMaterial: '', labor: '', expenses: '', margin: 30, category: '', description: '' });
  const [result, setResult] = useState(null);
  const [finalPrice, setFinalPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setInputs(p => ({ ...p, [field]: val }));

  const handleCalculate = async () => {
    const raw = parseFloat(inputs.rawMaterial) || 0;
    const labor = parseFloat(inputs.labor) || 0;
    const exp = parseFloat(inputs.expenses) || 0;
    if (raw + labor + exp === 0) { toast.error('Enter at least one cost value.'); return; }
    setLoading(true);
    try {
      const { data } = await aiAPI.suggestPrice({
        rawMaterialCost: raw, laborCost: labor,
        additionalExpenses: exp, desiredMarginPercent: inputs.margin,
        category: inputs.category, description: inputs.description,
      });
      setResult(data);
      setFinalPrice(String(data.breakdown?.suggestedPrice || ''));
    } catch {
      const base = raw + labor + exp;
      const suggested = Math.round(base * (1 + inputs.margin / 100));
      setResult({
        breakdown: { rawMaterialCost: raw, laborCost: labor, additionalExpenses: exp, baseCost: base, marginPercent: inputs.margin, suggestedPrice: suggested, marginAmount: Math.round(base * inputs.margin / 100) },
        aiRange: { minimum: Math.round(suggested * 0.9), maximum: Math.round(suggested * 1.3) },
        aiExplanation: 'Calculated from your actual costs.',
        disclaimer: 'AI-generated estimate — final pricing decision belongs to the artisan.',
      });
      setFinalPrice(String(suggested));
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = ['Handloom & Textiles','Home Décor & Furnishings','Handmade Jewelry & Accessories','Pottery & Terracotta','Wooden Handicrafts','Traditional Paintings & Wall Art','Eco-Friendly & Natural Products'];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-3">
          <HiCurrencyRupee className="text-gold-400 w-7 h-7" /> AI Price Suggester
        </h1>
        <p className="text-gray-400 text-sm mt-1">Enter your actual costs — get a transparent, fair price recommendation.</p>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-white">Your Production Costs</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'rawMaterial', label: 'Raw Material Cost (₹)', placeholder: 'e.g. 200' },
            { key: 'labor',       label: 'Labor / Time Cost (₹)', placeholder: 'e.g. 300' },
            { key: 'expenses',    label: 'Other Expenses (₹)',    placeholder: 'e.g. 100' },
            { key: 'margin',      label: 'Desired Profit Margin (%)', placeholder: '30' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
              <input
                type="number" min="0"
                value={inputs[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/60 placeholder-gray-600"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Category (optional)</label>
            <select value={inputs.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/60">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Product (optional)</label>
            <input
              value={inputs.description}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Bamboo storage basket"
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/60 placeholder-gray-600"
            />
          </div>
        </div>

        <button onClick={handleCalculate} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Calculating...</>
            : <><HiSparkles className="w-4 h-4" /> Calculate AI Price Suggestion</>}
        </button>
      </div>

      {result && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-white">Price Breakdown</h2>

          {/* Transparent calculation table */}
          <div className="bg-dark-700/60 rounded-xl p-4 space-y-2.5 border border-dark-600">
            {[
              ['Raw Material',   `₹${result.breakdown.rawMaterialCost}`],
              ['Labor Cost',     `₹${result.breakdown.laborCost}`],
              ['Other Expenses', `₹${result.breakdown.additionalExpenses}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm text-gray-400">
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-gray-300 border-t border-dark-500 pt-2.5 font-medium">
              <span>Base Cost</span><span>₹{result.breakdown.baseCost}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Profit ({result.breakdown.marginPercent}%)</span>
              <span>+ ₹{result.breakdown.marginAmount || Math.round(result.breakdown.baseCost * result.breakdown.marginPercent / 100)}</span>
            </div>
            <div className="flex justify-between text-white font-bold border-t border-dark-500 pt-2.5 text-base">
              <span>Suggested Selling Price</span>
              <span className="text-gold-400">₹{result.breakdown.suggestedPrice}</span>
            </div>
          </div>

          {/* AI range */}
          {result.aiRange && (
            <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <HiInformationCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-gold-400 text-sm font-semibold">AI Recommended Range</p>
                  <p className="text-white text-xl font-bold mt-1">₹{result.aiRange.minimum} – ₹{result.aiRange.maximum}</p>
                  {result.aiExplanation && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{result.aiExplanation}</p>}
                  {result.breakdown?.aiTips?.map((tip, i) => (
                    <p key={i} className="text-gray-500 text-xs mt-1">• {tip}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Final price input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Your Final Price (₹)</label>
            <input
              type="number" min="0"
              value={finalPrice}
              onChange={e => setFinalPrice(e.target.value)}
              className="w-full bg-dark-700 border border-gold-500/40 rounded-lg px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-gold-500 text-center"
              placeholder="Enter your price"
            />
            <p className="text-gray-600 text-xs text-center">{result.disclaimer}</p>
          </div>

          <button onClick={() => { setResult(null); setInputs({ rawMaterial: '', labor: '', expenses: '', margin: 30, category: '', description: '' }); setFinalPrice(''); }}
            className="btn-secondary w-full text-sm">
            Calculate Another Product
          </button>
        </div>
      )}
    </div>
  );
}
