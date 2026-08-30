import React, { useState, useRef, useCallback } from 'react';
import { HiUpload, HiMicrophone, HiSparkles, HiPencil, HiCheck, HiX, HiRefresh } from 'react-icons/hi';
import { aiAPI, productAPI, artisanAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STEPS = ['upload', 'describe', 'generate', 'review', 'publish'];
const CATEGORIES = ['Sarees', "Women's Fashion", "Men's Fashion", 'Handloom', 'Handmade', 'Accessories', 'Traditional Wear', 'Kurtas', 'Jewelry'];

export default function AIProductStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const recognitionRef = useRef(null);

  const [step, setStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [editedResult, setEditedResult] = useState(null);

  const handleImageDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep(1);
  }, []);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice input not supported in this browser. Please type your description.'); return; }
    const rec = new SpeechRecognition();
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-IN';
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e) => { setDescription(prev => prev + ' ' + e.results[0][0].transcript); };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => { setIsListening(false); toast.error('Voice recognition failed. Please type instead.'); };
    rec.start(); recognitionRef.current = rec;
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return '';
    try {
      const fd = new FormData(); fd.append('image', imageFile);
      const { data } = await productAPI.uploadDirect(fd);
      return data.imageUrl || '';
    } catch { return ''; }
  };

  const handleGenerate = async () => {
    if (!imageFile && !description.trim()) { toast.error('Please upload an image or describe your product'); return; }
    setStep(2); setIsGenerating(true);
    try {
      let uploadedUrl = '';
      if (imageFile) uploadedUrl = await uploadImageToCloudinary();
      setImageUrl(uploadedUrl);
      const { data } = await aiAPI.analyzeProduct({ image_url: uploadedUrl, description: description.trim() });
      setAiResult(data);
      setEditedResult({ ...data, price: data.suggested_price || 999, sizes: ['Free Size'], stock_quantity: 10 });
      setStep(3);
    } catch (err) {
      toast.error('AI generation failed. Please try again.'); setStep(1);
    } finally { setIsGenerating(false); }
  };

  const updateField = (field, value) => setEditedResult(prev => ({ ...prev, [field]: value }));

  const handlePublish = async (isDraft = false) => {
    if (!editedResult?.product_name) { toast.error('Product name is required'); return; }
    setIsPublishing(true);
    try {
      const profile = user?.artisan_profile;
      const productData = {
        name: editedResult.product_name,
        description: editedResult.description,
        price: parseFloat(editedResult.price) || editedResult.suggested_price || 999,
        original_price: parseFloat(editedResult.price) * 1.2,
        category: editedResult.category || 'Handmade',
        subcategory: editedResult.subcategory,
        material: editedResult.material,
        style: editedResult.style,
        tags: editedResult.tags || [],
        sizes: editedResult.sizes || ['Free Size'],
        stock_quantity: editedResult.stock_quantity || 10,
        is_in_stock: true,
        ai_generated: true,
        ai_suggested_price: editedResult.suggested_price,
        image_url: imageUrl || imagePreview,
        artisan_id: profile?.id,
        is_handmade: true,
      };
      await productAPI.create(productData);
      toast.success(isDraft ? 'Draft saved!' : 'Product published! 🎉');
      setStep(4);
      setTimeout(() => navigate('/artisan/products'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish. Please try again.');
    } finally { setIsPublishing(false); }
  };

  const reset = () => { setStep(0); setImageFile(null); setImagePreview(''); setDescription(''); setAiResult(null); setEditedResult(null); setImageUrl(''); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-3">
          <HiSparkles className="w-8 h-8 text-gold-400" /> AI Product Studio
        </h1>
        <p className="text-gray-400 mt-1">From Artisan to Online Store in One Click ✨</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-2">
        {['📸 Upload', '📝 Describe', '🤖 Generate', '✏️ Review', '🚀 Done'].map((label, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${i <= step ? 'bg-gold-500 text-dark-900' : 'bg-dark-700 text-gray-400'}`}>{label}</div>
            {i < 4 && <div className={`h-0.5 flex-1 min-w-4 ${i < step ? 'bg-gold-500' : 'bg-dark-600'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 0: Upload Image */}
      {step === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleImageDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-gold-400 bg-gold-500/10 scale-102' : 'border-dark-400 hover:border-gold-500/60 hover:bg-dark-700/50'}`}
        >
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-xl font-semibold text-white mb-2">Upload Your Product Photo</h3>
          <p className="text-gray-400 text-sm mb-4">Drag & drop your product image here, or click to browse</p>
          <p className="text-gray-500 text-xs">Supports JPG, PNG, WEBP · Max 10MB</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageDrop} />
        </div>
      )}

      {/* STEP 1: Describe */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="aspect-square rounded-xl overflow-hidden bg-dark-700 border border-dark-500">
                <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => { setStep(0); setImageFile(null); setImagePreview(''); }} className="mt-2 text-sm text-gray-400 hover:text-red-400 flex items-center gap-1">
                <HiX className="w-4 h-4" /> Change Image
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Describe your product (in any language)</label>
                <textarea
                  rows={6}
                  className="input-field resize-none"
                  placeholder={`Example:\n"This is a handmade cotton saree made by handloom artisans in Karnataka. It has beautiful traditional motifs and is perfect for weddings."`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button
                onClick={isListening ? stopVoice : startVoice}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${isListening ? 'bg-red-500/20 border border-red-500 text-red-400 animate-pulse' : 'btn-outline'}`}
              >
                <HiMicrophone className={`w-5 h-5 ${isListening ? 'text-red-400' : ''}`} />
                {isListening ? 'Listening... (click to stop)' : '🎤 Speak Description (Voice Input)'}
              </button>
              <div className="text-xs text-gray-500 bg-dark-700 rounded-lg p-3">
                💡 <strong>Tip:</strong> Mention material (cotton/silk), type (saree/kurta), occasion, and origin (Karnataka/Rajasthan) for better AI results.
              </div>
              <button onClick={handleGenerate} className="btn-primary flex items-center justify-center gap-2 py-4">
                <HiSparkles className="w-5 h-5" /> Generate with AI ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Generating */}
      {step === 2 && (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center text-4xl animate-spin">✨</div>
          <h3 className="text-xl font-serif font-bold text-white mb-2">KalaStyle AI is analyzing your product…</h3>
          <p className="text-gray-400 text-sm">Generating product name, description, category, tags, and price suggestions…</p>
          <div className="mt-6 flex justify-center gap-1">
            {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.15}s`}} />)}
          </div>
        </div>
      )}

      {/* STEP 3: Review & Edit */}
      {step === 3 && editedResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gold-400">
              <HiCheck className="w-5 h-5" />
              <span className="text-sm font-medium">AI has analyzed your product! Review and edit below.</span>
            </div>
            <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gold-400 flex items-center gap-1"><HiRefresh className="w-4 h-4" /> Regenerate</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Preview */}
            <div className="md:col-span-1">
              <div className="aspect-square rounded-xl overflow-hidden bg-dark-700 border border-dark-500">
                {imagePreview ? <img src={imagePreview} alt="Product" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>}
              </div>
              {aiResult?.ai_notes && <p className="text-xs text-gray-500 mt-2 italic">{aiResult.ai_notes}</p>}
            </div>

            {/* AI-Generated Fields */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Product Name *</label>
                <input className="input-field" value={editedResult.product_name} onChange={e => updateField('product_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Description</label>
                <textarea rows={4} className="input-field resize-none" value={editedResult.description} onChange={e => updateField('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Category</label>
                  <select className="input-field" value={editedResult.category} onChange={e => updateField('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Material</label>
                  <input className="input-field" value={editedResult.material || ''} onChange={e => updateField('material', e.target.value)} placeholder="e.g. Cotton, Silk" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Your Price (Rs.) *</label>
                  <input type="number" className="input-field" value={editedResult.price} onChange={e => updateField('price', e.target.value)} />
                  <p className="text-xs text-gold-500 mt-1">AI Suggested: Rs.{editedResult.suggested_price?.toLocaleString()} (Range: Rs.{editedResult.price_range?.min}–{editedResult.price_range?.max})</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Stock Qty</label>
                  <input type="number" className="input-field" value={editedResult.stock_quantity || 10} onChange={e => updateField('stock_quantity', parseInt(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Tags</label>
                <input className="input-field" value={(editedResult.tags || []).join(', ')} onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} placeholder="tag1, tag2, tag3" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dark-600">
            <button onClick={() => handlePublish(true)} disabled={isPublishing} className="btn-outline flex-1 flex items-center justify-center gap-2">
              💾 Save as Draft
            </button>
            <button onClick={() => handlePublish(false)} disabled={isPublishing} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4">
              {isPublishing ? 'Publishing...' : <><HiCheck className="w-5 h-5" /> Publish Product 🚀</>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h3 className="text-2xl font-serif font-bold text-white mb-2">Product Published!</h3>
          <p className="text-gray-400">Your product is now live on KalaStyle AI marketplace.</p>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={reset} className="btn-outline">Create Another</button>
            <a href="/artisan/products" className="btn-primary">View My Products</a>
          </div>
        </div>
      )}
    </div>
  );
}
