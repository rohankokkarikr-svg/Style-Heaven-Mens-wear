import React, { useEffect, useState } from 'react';
import { 
  HiSearch, 
  HiFilter, 
  HiCheckCircle, 
  HiXCircle, 
  HiEye, 
  HiEyeOff, 
  HiTrash, 
  HiRefresh,
  HiSparkles,
  HiX,
  HiExternalLink
} from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Rejection modal state
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('Incorrect product details or category mismatch');
  const [rejecting, setRejecting] = useState(false);

  // View modal state
  const [previewProduct, setPreviewProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getProducts({ 
        search, 
        category: categoryFilter, 
        status: statusFilter 
      });
      setProducts(data || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveProduct(id);
      toast.success('Product approved and published!');
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', rejection_reason: null } : p));
    } catch {
      toast.error('Failed to approve product');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    setRejecting(true);
    try {
      await adminAPI.rejectProduct(rejectModal.id, { reason: rejectReason });
      toast.success('Product rejected with reason noted');
      setProducts(prev => prev.map(p => p.id === rejectModal.id ? { ...p, status: 'rejected', rejection_reason: rejectReason } : p));
      setRejectModal(null);
      setRejectReason('Incorrect product details or category mismatch');
    } catch {
      toast.error('Failed to reject product');
    } finally {
      setRejecting(false);
    }
  };

  const handleHideToggle = async (id, isCurrentlyHidden) => {
    const nextHidden = !isCurrentlyHidden;
    try {
      await adminAPI.hideProduct(id, { is_hidden: nextHidden });
      toast.success(nextHidden ? 'Product hidden from public catalog' : 'Product unhidden');
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_hidden: nextHidden } : p));
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const getStatusBadge = (p) => {
    if (p.is_hidden) {
      return <span className="badge bg-gray-500/20 text-gray-400 border border-gray-500/30">⚫ Hidden</span>;
    }
    switch (p.status) {
      case 'approved':
        return <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">🟢 Approved</span>;
      case 'rejected':
        return <span className="badge bg-red-500/20 text-red-400 border border-red-500/30" title={p.rejection_reason || 'Rejected'}>🔴 Rejected</span>;
      default:
        return <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🟡 Pending</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">Product Management & Quality Assurance</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review artisan submissions, approve handcrafted products, and monitor catalog compliance.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products by title, category, material..."
                className="w-full bg-dark-700 border border-dark-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/60"
              />
            </div>
            <button type="submit" className="btn-primary text-xs py-2 px-3">Search</button>
          </form>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['all', 'pending', 'approved', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all border ${
                  statusFilter === st
                    ? 'bg-gold-500/20 border-gold-500/50 text-gold-400 font-semibold'
                    : 'border-dark-600 text-gray-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 shimmer rounded-lg" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-800/80 text-gray-400 border-b border-dark-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product Info</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Artisan Store</th>
                  <th className="py-3 px-4">Price & Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&auto=format&fit=crop'}
                          alt={p.name}
                          className="w-11 h-11 rounded-lg object-cover ring-1 ring-dark-500 shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&auto=format&fit=crop';
                          }}
                        />
                        <div className="overflow-hidden max-w-xs">
                          <p className="font-semibold text-white truncate flex items-center gap-1.5">
                            {p.name}
                            {p.ai_generated && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded">
                                AI
                              </span>
                            )}
                          </p>
                          <p className="text-gray-400 text-[10px] truncate">{p.material || 'Authentic Handcraft'}</p>
                          {p.rejection_reason && (
                            <p className="text-red-400 text-[10px] truncate font-medium">⚠️ {p.rejection_reason}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-dark-700 text-gray-300 border border-dark-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-medium">
                      {p.artisan_profiles?.store_name || p.artisan_name || 'KalaStyle Artisan'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gold-400">₹{(p.price || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-400">Stock: {p.stock_quantity || 0}</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(p)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setPreviewProduct(p)}
                        className="p-1.5 text-gray-400 hover:text-white rounded bg-dark-700 hover:bg-dark-600"
                        title="Quick View Details"
                      >
                        <HiEye className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/products/${p.id}`}
                        target="_blank"
                        className="p-1.5 text-gray-400 hover:text-gold-400 rounded bg-dark-700 hover:bg-dark-600 inline-block"
                        title="View Live Page"
                      >
                        <HiExternalLink className="w-4 h-4" />
                      </Link>
                      {p.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="p-1.5 text-green-400 hover:text-green-300 rounded bg-green-500/10 hover:bg-green-500/20"
                          title="Approve Listing"
                        >
                          <HiCheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {p.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectModal(p)}
                          className="p-1.5 text-yellow-400 hover:text-yellow-300 rounded bg-yellow-500/10 hover:bg-yellow-500/20"
                          title="Reject with Reason"
                        >
                          <HiXCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleHideToggle(p.id, p.is_hidden)}
                        className={`p-1.5 rounded transition-colors ${
                          p.is_hidden 
                            ? 'text-gray-300 bg-gray-600/20 hover:bg-gray-600/30' 
                            : 'text-gray-400 hover:text-gray-200 bg-dark-700 hover:bg-dark-600'
                        }`}
                        title={p.is_hidden ? 'Unhide Product' : 'Hide from Public Store'}
                      >
                        {p.is_hidden ? <HiEye className="w-4 h-4" /> : <HiEyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded bg-red-500/10 hover:bg-red-500/20"
                        title="Delete Product"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            No products found matching your search or filter.
          </div>
        )}
      </div>

      {/* Modal: Rejection Reason */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border border-dark-500">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Reject Product: {rejectModal.name}</h3>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-white">
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Provide a clear reason so the artisan knows what to correct:
            </p>
            <div className="space-y-2">
              {[
                'Incorrect product details or category mismatch',
                'Low resolution or unclear product imagery',
                'Missing craft material information',
                'Pricing or shipping policy discrepancy',
                'Duplicate listing'
              ].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    checked={rejectReason === opt}
                    onChange={() => setRejectReason(opt)}
                    className="text-gold-500 focus:ring-0"
                  />
                  <span>{opt}</span>
                </label>
              ))}
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Or type custom rejection reason..."
                className="w-full bg-dark-700 border border-dark-500 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-gold-500 mt-2 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRejectModal(null)} className="btn-secondary text-xs py-2 px-3">
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejecting}
                className="btn-primary bg-red-500 hover:bg-red-600 border-red-500 text-white text-xs py-2 px-4"
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Preview */}
      {previewProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 border border-dark-500 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setPreviewProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <HiX className="w-5 h-5" />
            </button>
            <div className="flex gap-4 items-start">
              <img
                src={previewProduct.image_url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop'}
                alt=""
                className="w-24 h-24 rounded-xl object-cover ring-1 ring-gold-500 shrink-0"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">{previewProduct.name}</h3>
                <p className="text-gold-400 text-xs font-semibold">{previewProduct.category} • ₹{previewProduct.price}</p>
                <div className="mt-1">{getStatusBadge(previewProduct)}</div>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-dark-600 pt-3">
              <p><strong className="text-gray-400">Material:</strong> <span className="text-gray-200">{previewProduct.material || 'Handcrafted'}</span></p>
              <p><strong className="text-gray-400">Artisan:</strong> <span className="text-gray-200">{previewProduct.artisan_profiles?.store_name || 'KalaStyle Artisan'}</span></p>
              <p><strong className="text-gray-400">Description:</strong></p>
              <div className="p-3 bg-dark-750 rounded-lg text-gray-300 leading-relaxed border border-dark-600">
                {previewProduct.description || 'No description provided.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
