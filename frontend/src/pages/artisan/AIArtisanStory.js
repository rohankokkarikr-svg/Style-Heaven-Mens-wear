import React, { useState } from 'react';
import { HiSparkles, HiPencil, HiCheck, HiUser } from 'react-icons/hi';
import { aiAPI, artisanAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AIArtisanStory() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name:            user?.name || '',
    location:        user?.artisan_profile?.location || '',
    craft:           user?.artisan_profile?.specialization || '',
    yearsExperience: '',
    familyHistory:   '',
    personalNote:    '',
  });
  const [story, setStory] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleGenerate = async () => {
    if (!form.name || !form.craft) { toast.error('Please enter your name and craft specialization.'); return; }
    setLoading(true);
    try {
      const { data } = await aiAPI.generateArtisanStory(form);
      setStory(data.story);
      setIsAIGenerated(data.isAIGenerated);
      setIsEditing(false);
      toast.success(data.isAIGenerated ? 'Your artisan story is ready!' : 'Story generated!');
    } catch {
      const fallback = `${form.name} is a skilled artisan from ${form.location || 'India'} specializing in ${form.craft}. ${form.yearsExperience ? `With ${form.yearsExperience} years of experience, they bring` : 'Bringing'} authentic craftsmanship to every piece they create. ${form.familyHistory ? form.familyHistory + '.' : ''} ${form.personalNote ? form.personalNote + '.' : 'Each handcrafted product reflects the rich cultural heritage of Indian artisanship.'}`;
      setStory(fallback);
      setIsAIGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!story.trim()) { toast.error('No story to save.'); return; }
    setSaving(true);
    try {
      await artisanAPI.updateProfile({ bio: story });
      toast.success('Artisan story saved to your profile!');
    } catch {
      toast.error('Could not save story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'name',            label: 'Full Name *',                  placeholder: 'e.g. Ravi Kumar' },
    { key: 'location',        label: 'Location (State/City)',        placeholder: 'e.g. Varanasi, Uttar Pradesh' },
    { key: 'craft',           label: 'Craft Specialization *',       placeholder: 'e.g. Handloom Weaving, Wooden Toys' },
    { key: 'yearsExperience', label: 'Years of Experience',          placeholder: 'e.g. 15' },
    { key: 'familyHistory',   label: 'Family Craft History',         placeholder: 'e.g. My father was a master weaver...' },
    { key: 'personalNote',    label: 'Personal Note (optional)',     placeholder: 'Anything else you want to share...' },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-3">
          <HiUser className="text-gold-400 w-7 h-7" /> AI Artisan Story Generator
        </h1>
        <p className="text-gray-400 text-sm mt-1">Share your story — AI will create a professional biography using only your information.</p>
      </div>

      <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 text-xs text-gold-400 flex items-start gap-2">
        <HiSparkles className="w-4 h-4 shrink-0 mt-0.5" />
        <span>AI only uses information you provide. Nothing is invented. You can edit and review before saving to your profile.</span>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-white">Your Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className={`space-y-1 ${key === 'familyHistory' || key === 'personalNote' ? 'sm:col-span-2' : ''}`}>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
              {key === 'familyHistory' || key === 'personalNote' ? (
                <textarea rows={3} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500/60 placeholder-gray-600 resize-none" />
              ) : (
                <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500/60 placeholder-gray-600" />
              )}
            </div>
          ))}
        </div>

        <button onClick={handleGenerate} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating your story...</>
            : <><HiSparkles className="w-4 h-4" /> Generate My Artisan Story</>}
        </button>
      </div>

      {story && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Your Artisan Story</h2>
            <div className="flex items-center gap-2">
              {isAIGenerated && (
                <span className="text-xs px-2 py-1 bg-gold-500/15 text-gold-400 border border-gold-500/30 rounded-full">AI Generated</span>
              )}
              <button onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gold-400 transition-colors border border-dark-600 rounded-lg px-3 py-1.5">
                {isEditing ? <><HiCheck className="w-3.5 h-3.5" /> Done Editing</> : <><HiPencil className="w-3.5 h-3.5" /> Edit</>}
              </button>
            </div>
          </div>

          {isEditing ? (
            <textarea
              rows={10}
              value={story}
              onChange={e => setStory(e.target.value)}
              className="w-full bg-dark-700 border border-gold-500/40 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500 leading-relaxed resize-none"
            />
          ) : (
            <div className="bg-dark-700/50 border border-dark-600 rounded-xl p-5">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{story}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleGenerate} disabled={loading}
              className="btn-secondary flex items-center gap-2 text-sm">
              <HiSparkles className="w-4 h-4" /> Regenerate
            </button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : <><HiCheck className="w-4 h-4" /> Save to My Profile</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
