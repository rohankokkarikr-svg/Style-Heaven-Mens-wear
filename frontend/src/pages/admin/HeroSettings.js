import React, { useState, useEffect } from 'react';
import { HiSave, HiPlus, HiTrash, HiPencil } from 'react-icons/hi';
import toast from 'react-hot-toast';

const DEFAULT_SLIDES = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336522/style-heaven-assets/hero_slide_1.png',
    badgeText: '',
    badgeType: 'new',
    headline: 'Redefine Your Style',
    subtitle: 'Premium menswear collection crafted for modern gentlemen.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336524/style-heaven-assets/hero_slide_2.png',
    badgeText: '✦ New Arrival',
    badgeType: 'new',
    headline: 'Summer Collection 2026',
    subtitle: 'Fresh arrivals with trending fashion styles.',
    buttonText: 'Explore Collection',
    buttonLink: '/products?category=shirts',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336525/style-heaven-assets/hero_slide_3.png',
    badgeText: '',
    badgeType: 'new',
    headline: 'Classic Meets Modern',
    subtitle: 'Elegant outfits for every occasion.',
    buttonText: 'View Products',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336527/style-heaven-assets/hero_slide_4.png',
    badgeText: '★ Limited Edition',
    badgeType: 'sale',
    headline: 'Luxury You Can Wear',
    subtitle: 'Discover exclusive fashion with premium quality.',
    buttonText: 'Discover More',
    buttonLink: '/products',
    align: 'center',
  },
];

export default function HeroSettings() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('heroSlides');
    if (saved) {
      let parsed = JSON.parse(saved);
      const pathMap = {
        '/hero_slide_1.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336522/style-heaven-assets/hero_slide_1.png',
        '/hero_slide_2.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336524/style-heaven-assets/hero_slide_2.png',
        '/hero_slide_3.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336525/style-heaven-assets/hero_slide_3.png',
        '/hero_slide_4.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336527/style-heaven-assets/hero_slide_4.png'
      };
      let needsUpdate = false;
      const migrated = parsed.map(s => {
        if (pathMap[s.image]) {
          needsUpdate = true;
          return { ...s, image: pathMap[s.image] };
        }
        return s;
      });
      if (needsUpdate) {
        localStorage.setItem('heroSlides', JSON.stringify(migrated));
        setSlides(migrated);
      } else {
        setSlides(parsed);
      }
    } else {
      setSlides(DEFAULT_SLIDES);
    }
  }, []);

  const saveToStorage = (updatedSlides) => {
    localStorage.setItem('heroSlides', JSON.stringify(updatedSlides));
    setSlides(updatedSlides);
    toast.success('Hero slides updated successfully');
  };

  const handleDelete = (id) => {
    if (slides.length <= 1) {
      toast.error('You must have at least one slide.');
      return;
    }
    if (window.confirm('Delete this slide?')) {
      saveToStorage(slides.filter((s) => s.id !== id));
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingSlide.headline || !editingSlide.image) {
      toast.error('Headline and Image are required.');
      return;
    }

    if (editingSlide.isNew) {
      const newSlide = { ...editingSlide, id: Date.now() };
      delete newSlide.isNew;
      saveToStorage([...slides, newSlide]);
    } else {
      saveToStorage(slides.map((s) => (s.id === editingSlide.id ? editingSlide : s)));
    }
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
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manage Hero Slides</h1>
          <p className="text-gray-400">Add, edit, or remove slides from the homepage hero section.</p>
        </div>
        <button onClick={openNewSlide} className="btn-primary py-2 px-4 flex items-center gap-2">
          <HiPlus className="w-5 h-5" /> Add Slide
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slides.map((slide, idx) => (
          <div key={slide.id} className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden relative group">
            <div className="h-40 bg-dark-700 relative">
              <img src={slide.image} alt="Slide" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-gold-400 text-xs font-bold uppercase tracking-widest block mb-1">
                  Slide {idx + 1}
                </span>
                <h3 className="text-lg font-serif font-bold text-white line-clamp-1">{slide.headline}</h3>
              </div>
            </div>
            
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingSlide(slide)}
                className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg"
              >
                <HiPencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(slide.id)}
                className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
              >
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-dark-800 rounded-2xl shadow-card border border-dark-600 w-full max-w-2xl mt-auto mb-auto">
            <div className="p-6 border-b border-dark-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingSlide.isNew ? 'Create New Slide' : 'Edit Slide'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Image URL or Path</label>
                  <input required type="text" className="input-field" placeholder="/hero_slide_1.png or https://..." value={editingSlide.image} onChange={(e) => setEditingSlide({...editingSlide, image: e.target.value})} />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1">Headline</label>
                  <input required type="text" className="input-field" value={editingSlide.headline} onChange={(e) => setEditingSlide({...editingSlide, headline: e.target.value})} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                  <input type="text" className="input-field" value={editingSlide.subtitle} onChange={(e) => setEditingSlide({...editingSlide, subtitle: e.target.value})} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1">Button Text</label>
                  <input type="text" className="input-field" value={editingSlide.buttonText} onChange={(e) => setEditingSlide({...editingSlide, buttonText: e.target.value})} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1">Button Link</label>
                  <input type="text" className="input-field" value={editingSlide.buttonLink} onChange={(e) => setEditingSlide({...editingSlide, buttonLink: e.target.value})} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1">Text Alignment</label>
                  <select className="input-field" value={editingSlide.align} onChange={(e) => setEditingSlide({...editingSlide, align: e.target.value})}>
                    <option value="left">Left Align</option>
                    <option value="center">Center Align</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1">Badge Text (Optional)</label>
                  <input type="text" className="input-field" placeholder="e.g. ✦ New Arrival" value={editingSlide.badgeText} onChange={(e) => setEditingSlide({...editingSlide, badgeText: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-dark-600">
                <button type="button" onClick={() => setEditingSlide(null)} className="btn-outline px-5 py-2">Cancel</button>
                <button type="submit" className="btn-primary px-6 py-2 flex items-center gap-2">
                  <HiSave className="w-5 h-5" /> Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
