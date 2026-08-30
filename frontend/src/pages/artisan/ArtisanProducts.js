import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { artisanAPI, productAPI } from '../../services/api';
import { HiPlus, HiPencil, HiTrash, HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ArtisanProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    artisanAPI.getMyStats().then(({ data }) => {
      setProducts(data.products || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      setProducts(p => p.filter(x => x.id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-serif font-bold text-white">My Products</h1><p className="text-gray-400 text-sm mt-1">{products.length} products in your store</p></div>
        <Link to="/artisan/ai-studio" className="btn-primary flex items-center gap-2"><HiSparkles className="w-4 h-4" /> Add with AI</Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="card h-48 shimmer" />)}</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="card overflow-hidden group">
              <div className="aspect-video bg-dark-700 relative overflow-hidden">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                {p.ai_generated && <span className="absolute top-2 left-2 bg-gold-500 text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded-full">🤖 AI Generated</span>}
                <div className="absolute top-2 right-2"><span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (p.is_in_stock ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white')}>{p.is_in_stock ? 'In Stock' : 'Out of Stock'}</span></div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{p.name}</h3>
                <p className="text-gold-400 font-bold mt-1">₹{p.price?.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">Stock: {p.stock_quantity}</p>
                <div className="flex gap-2 mt-3">
                  <Link to={'/products/' + p.id} className="btn-ghost text-xs px-3 py-1.5 border border-dark-400 rounded-lg flex-1 text-center">View</Link>
                  <button onClick={() => handleDelete(p.id)} className="btn-ghost text-xs px-3 py-1.5 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10"><HiTrash className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create your first product using our AI Product Studio</p>
          <Link to="/artisan/ai-studio" className="btn-primary inline-flex items-center gap-2"><HiSparkles className="w-4 h-4" /> Create with AI</Link>
        </div>
      )}
    </div>
  );
}
