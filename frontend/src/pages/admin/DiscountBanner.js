import React, { useState, useEffect } from 'react';
import { HiTag, HiSave, HiTrash, HiPencil } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function DiscountBanner() {
  const [banner, setBanner] = useState({
    title: 'Summer Sale Live',
    description: 'Use this code and get upto 30% discount',
    discount: '30%',
    code: 'SUMMER30',
    discountPercentage: 30,
    buttonText: 'Grab the Deal',
    buttonLink: '/products',
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load banner from localStorage
    const savedBannerStr = localStorage.getItem('discountBanner');
    if (savedBannerStr) {
      let savedBanner = JSON.parse(savedBannerStr);
      if (savedBanner.description === 'Up to 30% Off on Premium Collection') {
        savedBanner.description = 'Use this code and get upto 30% discount';
        localStorage.setItem('discountBanner', JSON.stringify(savedBanner));
      }
      setBanner(savedBanner);
    }
  }, []);

  const saveBanner = async () => {
    setLoading(true);
    try {
      localStorage.setItem('discountBanner', JSON.stringify(banner));
      toast.success('Discount banner saved successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to save discount banner');
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = () => {
    if (window.confirm('Are you sure you want to delete the discount banner?')) {
      localStorage.removeItem('discountBanner');
      setBanner({
        title: 'Summer Sale Live',
        description: 'Use this code and get upto 30% discount',
        discount: '30%',
        code: 'SUMMER30',
        discountPercentage: 30,
        buttonText: 'Grab the Deal',
        buttonLink: '/products',
        isActive: false
      });
      toast.success('Discount banner deleted');
    }
  };

  const handleChange = (field, value) => {
    setBanner(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif font-bold text-white">Discount Banner Management</h1>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-outline inline-flex items-center gap-2 px-4 py-2"
            >
              <HiPencil className="w-4 h-4" />
              Edit
            </button>
          )}
          {banner.isActive && (
            <button
              onClick={deleteBanner}
              className="btn-danger inline-flex items-center gap-2 px-4 py-2"
            >
              <HiTrash className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Banner Preview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
        {banner.isActive ? (
          <div className="bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 border-y border-dark-600 rounded-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gold-500/10 p-2.5 rounded-lg">
                    <HiTag className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gold-400 font-semibold text-sm uppercase tracking-wide">
                        {banner.title}
                      </p>
                      {banner.code && (
                        <span className="bg-gold-500 text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          CODE: {banner.code}
                        </span>
                      )}
                    </div>
                    <p className="text-white text-lg font-serif font-bold">
                      {banner.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
                  {banner.buttonText}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-8 text-center">
            <p className="text-gray-400">No active discount banner</p>
          </div>
        )}
      </div>

      {/* Banner Form */}
      {isEditing && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Edit Banner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Banner Title
              </label>
              <input
                type="text"
                value={banner.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="input-field"
                placeholder="e.g., Summer Sale Live"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Banner Description
              </label>
              <input
                type="text"
                value={banner.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="input-field"
                placeholder="e.g., Up to 30% Off on Premium Collection"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Code
              </label>
              <input
                type="text"
                value={banner.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                className="input-field"
                placeholder="e.g., SUMMER30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                value={banner.discountPercentage}
                onChange={(e) => handleChange('discountPercentage', parseInt(e.target.value))}
                className="input-field"
                placeholder="e.g., 30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={banner.buttonText}
                onChange={(e) => handleChange('buttonText', e.target.value)}
                className="input-field"
                placeholder="e.g., Grab the Deal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Button Link
              </label>
              <input
                type="text"
                value={banner.buttonLink}
                onChange={(e) => handleChange('buttonLink', e.target.value)}
                className="input-field"
                placeholder="/products"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="isActive"
              checked={banner.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-gold-500 border-dark-600 rounded focus:ring-gold-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
              Active (show banner on website)
            </label>
          </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={saveBanner}
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2"
              >
                <HiSave className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-outline px-6 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
      )}
    </div>
  );
}
