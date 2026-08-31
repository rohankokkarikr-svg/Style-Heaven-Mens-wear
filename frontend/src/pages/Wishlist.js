import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { HiHeart, HiTrash, HiShoppingCart, HiArrowRight, HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleMoveToCart = (product) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      return;
    }
    const defaultSize = product.sizes?.[0] || 'Standard';
    addToCart(product, defaultSize, 1);
    removeFromWishlist(product.id);
    toast.success(`Moved ${product.name} to your Cart! 🛒`);
  };

  return (
    <div className="min-h-screen bg-dark-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-gold-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-200">Wishlist</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-700 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-white">My Wishlist</h1>
              <span className="px-3 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Your curated collection of handcrafted Indian artisanal treasures.
            </p>
          </div>

          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <HiTrash className="w-4 h-4" />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {/* Wishlist Items Grid */}
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const image = item.image_url || item.image || (item.images && item.images[0]) || '';
              const discount = item.discount_percentage || (item.original_price
                ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
                : null);

              return (
                <div
                  key={item.id}
                  className="group bg-dark-800 rounded-2xl overflow-hidden border border-dark-600 hover:border-gold-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-dark-700">
                    <img
                      src={image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded shadow">
                        🔥 {discount}% OFF
                      </span>
                    )}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-dark-900/80 hover:bg-red-500 text-gray-300 hover:text-white transition-all shadow"
                      title="Remove from Wishlist"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-gold-400 font-medium">{item.category || 'Handicraft'}</span>
                      <Link to={`/products/${item.id}`}>
                        <h3 className="font-serif font-bold text-white group-hover:text-gold-400 transition-colors text-sm line-clamp-1 mt-0.5">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-bold text-white">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-xs text-gray-500 line-through">
                            ₹{Number(item.original_price).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dark-700/80 flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="btn-gold flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        <HiShoppingCart className="w-4 h-4" />
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-dark-800/60 rounded-3xl border border-dark-700 p-8 max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 text-3xl text-red-400">
              <HiHeart />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Explore India's rich handlooms, traditional paintings, blue pottery, and artisanal woodwork and save your favorites here.
            </p>
            <Link
              to="/products"
              className="btn-gold inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold shadow-gold"
            >
              <HiSparkles className="w-4 h-4" />
              <span>Explore Indian Handicrafts</span>
              <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
