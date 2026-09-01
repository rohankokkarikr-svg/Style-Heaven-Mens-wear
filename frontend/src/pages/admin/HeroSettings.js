import React, { useState, useEffect } from 'react';
import { HiSave, HiPlus, HiTrash, HiPencil, HiArrowUp, HiArrowDown, HiGlobeAlt } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useSettings, DEFAULT_HERO_SLIDES } from '../../context/SettingsContext';

export default function HeroSettings() {
  const { settings, updateSettings } = useSettings();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  useEffect(() => {
    if (Array.isArray(settings?.heroSlides) && settings.heroSlides.length > 0) {
      setSlides(settings.heroSlides);
    } else {
      setSlides(DEFAULT_HERO_SLIDES);
    }
  }, [settings?.heroSlides]);

  const saveToServer = async (updatedSlides) => {
    setLoading(true);
    try {
      await updateSettings({ heroSlides: updatedSlides });
      setSlides(updatedSlides);
      toast.success('Hero slides updated & synced to all devices!');
    } catch (err) {
      console.error('Failed to save hero slides:', err);
      toast.error('Failed to sync hero slides to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (slides.length <= 1) {
      toast.error('You must keep at least one hero slide.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this slide from all devices?')) {
      const remaining = slides.filter((s) => s.id !== id);
      await saveToServer(remaining);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const reordered = [...slides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    await saveToServer(reordered);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSlide.headline?.trim() || !editingSlide.image?.trim()) {
      toast.error('Headline and Image URL are required.');
      return;
    }

    let updatedList;
    if (editingSlide.isNew) {
      const newSlide = {
        ...editingSlide,
        id: Date.now(),
      };
      delete newSlide.isNew;
      updatedList = [...slides, newSlide];
    } else {
      updatedList = slides.map((s) => (s.id === editingSlide.id ? editingSlide : s));
    }

    await saveToServer(updatedList);
    setEditingSlide(null);
  };

  const openNewSlide = () => {
    setEditingSlide({
      isNew: true,
      image: '',
      badgeText: '',
      badgeType: 'new',
      headline: '',
      subtitle: '',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      align: 'left',
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-dark-800 p-6 rounded-2xl border border-dark-600">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-serif font-bold text-white">Homepage Hero Slides & Banners</h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <HiGlobeAlt className="w-3.5 h-3.5" /> Live Sync Active
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Changes saved here automatically sync across all mobile phones, computers, and the live production server.
          </p>
        </div>
        <button
          onClick={openNewSlide}
          className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm whitespace-nowrap shadow-gold-sm"
        >
          <HiPlus className="w-5 h-5" /> Add New Slide
        </button>
      </div>

      {/* Grid of Slides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden relative group hover:border-gold-500/40 transition-all shadow-card flex flex-col justify-between"
          >
            {/* Image Preview */}
            <div className="h-48 bg-dark-700 relative overflow-hidden">
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.headline}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  No Image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />
              
              {/* Badge & Slide Number */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-black/60 backdrop-blur-sm text-gold-400 text-xs font-bold px-2.5 py-1 rounded-md border border-white/10 uppercase tracking-wider">
                  Slide {idx + 1}
                </span>
                {slide.badgeText && (
                  <span className="bg-gold-500/20 text-gold-300 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-gold-500/30">
                    {slide.badgeText}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {idx > 0 && (
                  <button
                    onClick={() => handleMove(idx, -1)}
                    title="Move slide earlier"
                    className="w-8 h-8 flex items-center justify-center bg-dark-700/80 hover:bg-dark-600 text-gray-200 rounded-full backdrop-blur-sm border border-white/10 transition-transform active:scale-95"
                  >
                    <HiArrowUp className="w-4 h-4" />
                  </button>
                )}
                {idx < slides.length - 1 && (
                  <button
                    onClick={() => handleMove(idx, 1)}
                    title="Move slide later"
                    className="w-8 h-8 flex items-center justify-center bg-dark-700/80 hover:bg-dark-600 text-gray-200 rounded-full backdrop-blur-sm border border-white/10 transition-transform active:scale-95"
                  >
                    <HiArrowDown className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setEditingSlide(slide)}
                  title="Edit slide"
                  className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-transform active:scale-95"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  title="Delete slide"
                  className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform active:scale-95"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>

              {/* Headline & Align */}
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-lg font-serif font-bold text-white line-clamp-1 drop-shadow">
                  {slide.headline}
                </h3>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-2 bg-dark-800 text-xs text-gray-300">
              <p className="text-gray-400 line-clamp-2 leading-relaxed">
                {slide.subtitle || <span className="italic text-gray-600">No subtitle text</span>}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dark-700">
                <span className="text-gold-400 font-medium">
                  CTA: <span className="text-gray-200 font-normal">{slide.buttonText}</span> → <span className="text-gray-400">{slide.buttonLink}</span>
                </span>
                <span className="text-gray-500 capitalize">Align: {slide.align || 'left'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Slide Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-dark-800 rounded-2xl shadow-card border border-dark-600 w-full max-w-2xl my-auto overflow-hidden">
            <div className="p-6 border-b border-dark-600 flex justify-between items-center bg-dark-750">
              <div>
                <h2 className="text-xl font-bold text-white font-serif">
                  {editingSlide.isNew ? '✨ Create New Hero Slide' : '✏️ Edit Hero Slide'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Updates will immediately reflect across all phone screens and web visitors.
                </p>
              </div>
              <button
                onClick={() => setEditingSlide(null)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Banner Image URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field text-sm"
                    placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                    value={editingSlide.image}
                    onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                  />
                  {editingSlide.image && (
                    <div className="mt-2 h-24 rounded-lg overflow-hidden border border-dark-600 relative">
                      <img
                        src={editingSlide.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="absolute bottom-1 right-2 text-[10px] bg-black/60 text-gray-300 px-1.5 py-0.5 rounded">
                        Live Preview
                      </span>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Main Headline <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field text-sm font-medium"
                    placeholder="e.g. Authentic Indian Handicrafts"
                    value={editingSlide.headline}
                    onChange={(e) => setEditingSlide({ ...editingSlide, headline: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Subtitle Description
                  </label>
                  <textarea
                    rows="2"
                    className="input-field text-sm"
                    placeholder="Short description displayed beneath the headline..."
                    value={editingSlide.subtitle}
                    onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Button Text
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="e.g. Explore Handlooms"
                    value={editingSlide.buttonText}
                    onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Button Link (URL / Route)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="/products?category=Handloom+%26+Textiles"
                    value={editingSlide.buttonLink}
                    onChange={(e) => setEditingSlide({ ...editingSlide, buttonLink: e.target.value })}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Text Alignment
                  </label>
                  <select
                    className="input-field text-sm"
                    value={editingSlide.align || 'left'}
                    onChange={(e) => setEditingSlide({ ...editingSlide, align: e.target.value })}
                  >
                    <option value="left">Left Align (Standard)</option>
                    <option value="center">Center Align</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="e.g. ✦ Heritage Weaves"
                    value={editingSlide.badgeText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badgeText: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-dark-600">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="btn-outline px-5 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-6 py-2 flex items-center gap-2 text-sm font-semibold"
                >
                  <HiSave className="w-4 h-4" /> {loading ? 'Saving to Server...' : 'Save & Sync Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
