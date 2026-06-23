import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { HiShoppingCart, HiStar } from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * ProductCard – shows product image, name, price, rating, and quick-add button.
 * Sizes are simplified: user selects on detail page.
 */
export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();


  if (!product) return null;

  const { id, name, price, original_price, rating, review_count, sizes, image_url } = product;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    const defaultSize = sizes?.[0] || 'M';
    addToCart(product, defaultSize, 1);
  };

  return (
    <>
      <Link to={`/products/${id}`} className="group bg-dark-800 rounded-xl overflow-hidden 
                                     border border-dark-600 hover:border-gold-500/50 transition-all duration-300
                                     hover:shadow-gold hover:shadow-gold/20">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-dark-700">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-600 text-gray-500">
              <span className="text-5xl">👔</span>
            </div>
          )}

          {/* Low Stock overlay badge */}
          {product.is_in_stock !== false && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 25 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gold-500 text-dark-900 rounded shadow-lg animate-pulse z-10">
              Only {product.stock_quantity} left!
            </span>
          )}

          {/* Out of Stock overlay badge */}
          {(product.is_in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0)) && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white rounded shadow-lg z-10">
              Out of Stock
            </span>
          )}

          {/* Quick Add button – slides up on hover */}
          {product.is_in_stock !== false && (product.stock_quantity === undefined || product.stock_quantity > 0) ? (
            <button
              onClick={handleQuickAdd}
              className="absolute bottom-0 left-0 right-0 bg-gradient-luxury text-dark-900
                         font-semibold py-3 flex items-center justify-center gap-2
                         translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            >
              <HiShoppingCart className="w-4 h-4" />
              Quick Add
            </button>
          ) : (
            <div
              className="absolute bottom-0 left-0 right-0 bg-red-600/95 text-white
                         font-semibold py-3 flex items-center justify-center gap-2
                         translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            >
              Out of Stock
            </div>
          )}


        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-100 group-hover:text-gold-400
                         transition-colors truncate">{name}</h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <HiStar key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-gold-400' : 'text-gray-600'}`} />
            ))}
            {review_count > 0 && (
              <span className="text-xs text-gray-500">({review_count})</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-2 mt-2">
            <span className="text-lg font-bold text-gold-400">₹{price?.toLocaleString()}</span>
            {original_price && (
              <span className="text-gray-500 text-sm line-through">₹{original_price?.toLocaleString()}</span>
            )}
          </div>

          {/* Available sizes */}
          {sizes?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {sizes.slice(0, 5).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 border border-dark-400
                                         rounded text-gray-400">{s}</span>
              ))}
            </div>
          )}
        </div>
      </Link>


    </>
  );
}
