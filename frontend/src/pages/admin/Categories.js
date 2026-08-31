import React, { useEffect, useState } from 'react';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiCheckCircle, 
  HiXCircle, 
  HiFolder, 
  HiRefresh, 
  HiX,
  HiPhotograph
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    subcategories: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getCategories();
      setCategories(data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        image_url: cat.image_url || '',
        subcategories: Array.isArray(cat.subcategories) ? cat.subcategories.join(', ') : '',
        is_active: cat.is_active !== false
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        subcategories: '',
        is_active: true
      });
    }
    setModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, formData);
        toast.success('Category updated!');
      } else {
        await adminAPI.createCategory(formData);
        toast.success('Category created!');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? Existing products in this category may be affected.`)) return;
    try {
      await adminAPI.deleteCategory(id);
      toast.success('Category deleted');
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <HiFolder className="text-gold-400 w-6 h-6" /> Category & Craft Taxonomy
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage the 7 primary Indian Handicraft categories, subcategories, and cover imagery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCategories}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <HiPlus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card h-52 shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div key={c.id} className="card overflow-hidden flex flex-col justify-between group border border-dark-600 hover:border-gold-500/50 transition-all duration-300">
              <div>
                <div className="h-36 relative overflow-hidden bg-dark-700">
                  <img
                    src={c.image_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop'}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.is_active !== false ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                  }`}>
                    {c.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-serif font-bold text-white text-base truncate">{c.name}</h3>
                    <p className="text-gray-400 text-xs line-clamp-1">{c.description}</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Subcategories</p>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {(Array.isArray(c.subcategories) ? c.subcategories : []).map((sub, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-dark-700 text-gray-300 border border-dark-600">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-dark-600/70 flex items-center justify-between bg-dark-850">
                <span className="text-[11px] text-gray-400">Slug: <code className="text-gold-400 font-mono">{c.slug}</code></span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(c)}
                    className="p-1.5 text-gray-300 hover:text-white rounded bg-dark-700 hover:bg-dark-600 transition-colors"
                    title="Edit Category"
                  >
                    <HiPencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    title="Delete Category"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCategory} className="card max-w-lg w-full p-6 space-y-4 border border-dark-500">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dokra Metal Craft"
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. dokra-metal-craft"
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the crafts in this category..."
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Subcategories (comma-separated)</label>
                <input
                  type="text"
                  value={formData.subcategories}
                  onChange={e => setFormData({ ...formData, subcategories: e.target.value })}
                  placeholder="e.g. Figurines, Diyas, Tribal Jewelry, Wall Bells"
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="text-gold-500 rounded bg-dark-700 border-dark-500 focus:ring-0"
                />
                <label htmlFor="cat-active" className="text-gray-300 cursor-pointer">
                  Category is Active and visible in storefront
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-600">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs py-2 px-3">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary text-xs py-2 px-4">
                {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
