import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productAPI } from '../../services/api';
import {
  HiPlus, HiPencil, HiTrash, HiSearch, HiX,
  HiPhotograph, HiTag, HiCube, HiCheckCircle
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'T-Shirts', 'Shirts', 'Pants', 'Jeans',
  'Jackets', 'Suits', 'Kurtas', 'Accessories',
];

const SIZE_PRESETS = {
  'T-Shirts':    ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  'Shirts':      ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Pants':       ['28', '30', '32', '34', '36', '38', '40'],
  'Jeans':       ['28', '30', '32', '34', '36', '38', '40'],
  'Jackets':     ['S', 'M', 'L', 'XL', 'XXL'],
  'Suits':       ['S', 'M', 'L', 'XL', 'XXL'],
  'Kurtas':      ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  'Accessories': ['One Size', '6', '7', '8', '9', '10', '11', 'S/M', 'L/XL'],
};

const EMPTY_FORM = {
  name: '', description: '', price: '', original_price: '',
  category: 'T-Shirts', sizes: [], stock_quantity: 50, is_in_stock: true,
  image_url: '',
};

export default function AdminProducts() {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const fileRef = useRef();

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await productAPI.getAll({ search });
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── filtered list ──────────────────────────────────────────────────────────
  const filtered = filterCat === 'all'
    ? products
    : products.filter(p => p.category === filterCat);

  // ── modal open ─────────────────────────────────────────────────────────────
  const openModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name:           product.name,
        description:    product.description || '',
        price:          product.price,
        original_price: product.original_price || '',
        category:       product.category,
        sizes:          product.sizes || [],
        stock_quantity: product.stock_quantity ?? 50,
        is_in_stock:    product.is_in_stock !== false,
        image_url:      product.image_url || '',
      });
      setImagePreview(product.image_url || null);
    } else {
      setCurrentProduct(null);
      setFormData(EMPTY_FORM);
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  // ── size toggle ────────────────────────────────────────────────────────────
  const toggleSize = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleCategoryChange = (cat) => {
    setFormData(prev => ({ ...prev, category: cat, sizes: [] }));
  };

  // ── image file change ──────────────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      
      setUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      try {
        const { data } = await productAPI.uploadDirect(fd);
        setFormData(prev => ({ ...prev, image_url: data.imageUrl }));
        setImagePreview(data.imageUrl);
        toast.success('📷 Image uploaded directly to Cloudinary!');
      } catch (err) {
        toast.error('Failed to upload image directly to Cloudinary');
      } finally {
        setUploading(false);
      }
    }
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim())          return toast.error('Product name is required');
    if (!formData.price)                return toast.error('Price is required');
    if (formData.sizes.length === 0)    return toast.error('Select at least one size');
    if (!formData.image_url)            return toast.error('Please upload a product image or enter an image URL');

    setSubmitting(true);
    try {
      const payload = {
        name:           formData.name.trim(),
        description:    formData.description.trim(),
        price:          Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : null,
        category:       formData.category,
        sizes:          formData.sizes,
        stock_quantity: Number(formData.stock_quantity),
        is_in_stock:    formData.is_in_stock,
        image_url:      formData.image_url,
      };

      if (currentProduct) {
        await productAPI.update(currentProduct.id, payload);
        toast.success('✅ Product updated!');
      } else {
        await productAPI.create(payload);
        toast.success('✅ Product created!');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Products</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtered.length} products {filterCat !== 'all' ? `in ${filterCat}` : 'total'}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="input-field pl-10 py-2 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Category filter */}
          <select
            className="input-field py-2 flex-1 md:w-44"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Add button */}
          <button onClick={() => openModal()} className="btn-primary py-2 flex items-center gap-2 shrink-0">
            <HiPlus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      {/* Category tab pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', ...CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterCat === c
                ? 'bg-gold-500 text-dark-900 border-gold-500'
                : 'border-dark-500 text-gray-400 hover:border-gold-500/50 hover:text-gray-200'
            }`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-800 border-b border-dark-600">
                <th className="p-4 text-sm font-semibold text-gray-300">Product</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Category</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Price</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Sizes</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Stock</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading products...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No products found.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-lg bg-dark-600 overflow-hidden shrink-0 border border-dark-500">
                          {p.image_url
                            ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                            : <span className="flex items-center justify-center h-full text-xl">👔</span>}
                        </div>
                        <div>
                          <div className="font-medium text-white line-clamp-1">{p.name}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <div className="text-xs text-gray-500 line-clamp-1">{p.description}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-[11px] bg-dark-700 border border-dark-500 rounded-full text-gray-300">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-gold-400 font-semibold">₹{p.price?.toLocaleString()}</div>
                      {p.original_price && (
                        <div className="text-gray-500 text-xs line-through">₹{p.original_price?.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap max-w-[120px]">
                        {p.sizes?.slice(0, 4).map(s => (
                          <span key={s} className="px-1.5 py-0.5 text-[10px] bg-dark-600 rounded text-gray-300">{s}</span>
                        ))}
                        {p.sizes?.length > 4 && (
                          <span className="text-[10px] text-gray-500">+{p.sizes.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {p.is_in_stock === false || p.stock_quantity <= 0 ? (
                        <span className="px-2 py-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">Out of Stock</span>
                      ) : p.stock_quantity < 5 ? (
                        <span className="px-2 py-1 text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 rounded-full font-bold animate-pulse">⚠️ Low Stock Alert ({p.stock_quantity} left)</span>
                      ) : p.stock_quantity < 10 ? (
                        <span className="px-2 py-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">Low: {p.stock_quantity}</span>
                      ) : (
                        <span className="px-2 py-1 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">In Stock ({p.stock_quantity})</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal(p)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit">
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-dark-800 rounded-2xl shadow-card border border-dark-600 w-full max-w-2xl my-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-dark-600">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {currentProduct ? '✏️ Edit Product' : '➕ Add New Product'}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">Fill in all the details manually</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* ── Section 1: Basic Info ─────────────────────────────── */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  <HiTag className="w-4 h-4" /> Basic Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Product Name <span className="text-red-400">*</span></label>
                    <input
                      required type="text"
                      className="input-field"
                      placeholder="e.g. Classic White Oxford Shirt"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category <span className="text-red-400">*</span></label>
                    <select
                      className="input-field"
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                      rows="3"
                      className="input-field resize-none"
                      placeholder="Describe the product — material, fit, occasion..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 2: Pricing ───────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  <HiTag className="w-4 h-4" /> Pricing
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Selling Price (₹) <span className="text-red-400">*</span></label>
                    <input
                      required type="number" min="1"
                      className="input-field"
                      placeholder="e.g. 799"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Original / MRP (₹) <span className="text-xs text-gray-500">optional</span></label>
                    <input
                      type="number" min="0"
                      className="input-field"
                      placeholder="e.g. 1199 (shows strikethrough)"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 3: Sizes ─────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  <HiCube className="w-4 h-4" /> Available Sizes <span className="text-red-400 font-normal normal-case">*</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(SIZE_PRESETS[formData.category] || SIZE_PRESETS['T-Shirts']).map(size => (
                    <button
                      key={size} type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        formData.sizes.includes(size)
                          ? 'bg-gold-500 text-dark-900 border-gold-500 shadow-gold'
                          : 'border-dark-500 text-gray-400 hover:border-gold-500/50 hover:text-gray-200'
                      }`}
                    >
                      {formData.sizes.includes(size) && <HiCheckCircle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
                      {size}
                    </button>
                  ))}
                </div>
                {formData.sizes.length > 0 && (
                  <p className="text-xs text-gold-400 mt-2">Selected: {formData.sizes.join(', ')}</p>
                )}
              </div>

              {/* ── Section 4: Stock ─────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  <HiCube className="w-4 h-4" /> Stock
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stock Quantity</label>
                    <input
                      type="number" min="0"
                      className="input-field"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Availability</label>
                    <select
                      className="input-field"
                      value={String(formData.is_in_stock)}
                      onChange={(e) => setFormData({ ...formData, is_in_stock: e.target.value === 'true' })}
                    >
                      <option value="true">✅ In Stock</option>
                      <option value="false">❌ Out of Stock</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Section 5: Image ─────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  <HiPhotograph className="w-4 h-4" /> Product Image <span className="text-red-400 font-normal normal-case">*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload file */}
                  <div
                    className="border-2 border-dashed border-dark-500 rounded-xl p-4 text-center cursor-pointer hover:border-gold-500/50 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <HiPhotograph className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Click to upload image</p>
                    <p className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP — uploaded to Cloudinary</p>
                    <input
                      ref={fileRef}
                      type="file" accept="image/*" className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  {/* OR image URL */}
                  <div className="flex flex-col justify-center">
                    <label className="block text-sm text-gray-400 mb-1">Or paste image URL</label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value || null);
                      }}
                    />
                    <p className="text-xs text-gray-600 mt-1">Cloudinary / Unsplash / direct link</p>
                  </div>
                </div>
                {/* Image preview */}
                {imagePreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-20 h-24 rounded-lg bg-dark-700 overflow-hidden border border-dark-500 shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs text-green-400 font-medium">✅ Image preview</p>
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setFormData(p => ({ ...p, image_url: '' })); }}
                        className="text-xs text-red-400 hover:underline mt-1"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ───────────────────────────────────────────── */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-600">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="btn-primary px-7 py-2.5 min-w-[130px]"
                >
                  {uploading ? '⬆️ Uploading...' : submitting ? '💾 Saving...' : currentProduct ? '✅ Update Product' : '➕ Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
