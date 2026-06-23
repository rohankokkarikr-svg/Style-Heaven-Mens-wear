import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productAPI, reviewAPI } from '../services/api';
import { getAvatarUrl } from '../utils/avatarUtils';
import { motion } from 'framer-motion';
import ReviewModal from '../components/ReviewModal';
import SizeGuideModal from '../components/SizeGuideModal';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { HiShoppingCart, HiStar, HiTruck, HiShieldCheck, HiPencilAlt, HiCheckCircle } from 'react-icons/hi';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Is this product true to size?',
      a: 'Yes! Most of our garments fit true to size. We recommend clicking the "Size Guide" link above the size selector to measure yourself and get an exact size recommendation.',
    },
    {
      q: 'What is the laundry/wash care guide?',
      a: 'We suggest machine washing cold with similar colors. For shirts and kurtas, hang dry to prevent excessive wrinkles. Do not tumble dry high or bleach.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Standard shipping takes 2-3 business days for tier-1 cities across India. For other locations, deliveries are completed within 4-5 business days.',
    },
    {
      q: 'Can I return if the fit is not perfect?',
      a: 'Absolutely! We offer a 10-day exchange and return policy. The item must be unworn, unwashed, and with all original tags attached.',
    }
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await productAPI.getById(id);
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (err) {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (!product) return;

    // Fetch related products (same category)
    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        const { data } = await productAPI.getAll({ category: product.category });
        // Filter out current product and show ALL related items
        const related = data.filter(p => p.id !== product.id);
        setRelatedProducts(related);
      } catch (err) {
        console.error('Failed to fetch related products', err);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();

    reviewAPI.getApproved()
      .then(res => {
        // Filter reviews matching this product name (case-insensitive and trimmed)
        const filtered = (res.data || []).filter(
          r => r.product_name?.trim().toLowerCase() === product.name?.trim().toLowerCase()
        );
        setProductReviews(filtered);
      })
      .catch((err) => {
        console.error('Error fetching reviews:', err);
      });
  }, [product]);

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to write a review');
      navigate('/login');
      return;
    }
    setReviewModalOpen(true);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    if (!selectedSize && product.sizes?.length > 0) {
      toast.error('Please select a size');
      return;
    }
    addToCart(product, selectedSize, quantity);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-12 h-12 border-4 border-dark-600 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  // Calculate review stats for the graph
  const totalReviews = productReviews.length;
  const averageRating = totalReviews > 0 
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : 0;

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  productReviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) ratingCounts[Math.floor(r.rating)]++;
  });

  const ratingLabels = {
    5: 'Excellent',
    4: 'Very Good',
    3: 'Good',
    2: 'Average',
    1: 'Poor'
  };
  
  const ratingColors = {
    5: 'bg-[#00a859]',
    4: 'bg-[#00a859]',
    3: 'bg-[#fbb03b]',
    2: 'bg-[#f58220]',
    1: 'bg-[#ed1c24]'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-dark-800 rounded-xl overflow-hidden border border-dark-600">
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="badge bg-dark-800 text-gold-400 capitalize border border-gold-500/30">
              {product.category}
            </span>
            {product.is_in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0) ? (
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 rounded-full">
                Out of Stock
              </span>
            ) : (
              <>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                  In Stock
                </span>
                {product.stock_quantity !== undefined && product.stock_quantity > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded-full animate-pulse">
                    🔥 Only {product.stock_quantity} pieces left
                  </span>
                )}
              </>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <HiStar key={i} className="w-5 h-5 text-gold-400" />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              {productReviews.length > 0 ? `(${productReviews.length} Review${productReviews.length > 1 ? 's' : ''})` : '(Be the first to review!)'}
            </span>
            <button
              onClick={handleWriteReview}
              className="ml-auto flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 font-medium border border-gold-500/30 hover:border-gold-500/60 px-3 py-1.5 rounded-lg bg-gold-500/5 hover:bg-gold-500/10 transition-all"
            >
              <HiPencilAlt className="w-4 h-4" />
              Write a Review
            </button>
          </div>

          <div className="flex items-end gap-4 mb-8">
            <span className="text-3xl font-bold text-gold-400">₹{product.price?.toLocaleString()}</span>
            {product.original_price && (
              <span className="text-xl text-gray-500 line-through mb-1">
                ₹{product.original_price?.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-gray-300 mb-8 leading-relaxed">
            {product.description || 'Premium quality garment crafted with attention to detail. Perfect for any occasion. Elevate your wardrobe with Style Heaven.'}
          </p>

          {/* Size Selector */}
          {product.sizes?.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-white">Select Size</span>
                <button 
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-sm text-gray-400 underline hover:text-gold-400"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-14 h-14 rounded-lg font-medium border flex items-center justify-center transition-all ${
                      selectedSize === s 
                        ? 'border-gold-500 text-gold-400 bg-gold-500/10' 
                        : 'border-dark-500 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add */}
          <div className="flex gap-4 mb-10">
            <div className="flex items-center border border-dark-500 rounded-lg bg-dark-800 p-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >-</button>
              <span className="w-12 text-center font-medium text-white">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >+</button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={product.is_in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0)}
              className={`flex-1 flex items-center justify-center gap-2 text-lg font-bold py-3 rounded-xl transition-all ${
                product.is_in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0)
                  ? 'bg-dark-600 text-gray-500 cursor-not-allowed border border-dark-500'
                  : 'btn-primary'
              }`}
            >
              <HiShoppingCart className="w-6 h-6" /> 
              {product.is_in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0) ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dark-600">
            <div className="flex items-center gap-3">
              <HiTruck className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Free Delivery</p>
                <p className="text-xs text-gray-500">2-3 business days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HiShieldCheck className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Secure Checkout</p>
                <p className="text-xs text-gray-500">100% protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Section */}
      <div className="mt-16 border-t border-dark-600 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Side: Ratings & Reviews List (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-8 text-center md:text-left">Product Ratings & Reviews</h2>
              
              <div className="bg-dark-800 border border-dark-600 rounded-xl p-8 shadow-card flex flex-col md:flex-row items-center gap-12 mb-8">
                {/* Left Side: Average */}
                <div className="flex flex-col items-center justify-center min-w-[150px]">
                  <div className="flex items-center gap-2 text-5xl font-bold text-gold-400 mb-2">
                    {totalReviews > 0 ? averageRating : '0.0'}
                    <HiStar className="w-10 h-10" />
                  </div>
                  <p className="text-gray-400 text-sm text-center">
                    {totalReviews} Ratings,<br/>
                    {totalReviews} Reviews
                  </p>
                </div>

                {/* Right Side: Graph */}
                <div className="flex-1 w-full space-y-4">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingCounts[star];
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-4">
                        <span className="w-24 text-right text-sm font-medium text-gray-300">
                          {ratingLabels[star]}
                        </span>
                        <div className="flex-1 h-2.5 bg-dark-600 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${ratingColors[star]}`}
                          />
                        </div>
                        <span className="w-12 text-sm text-gray-400">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Real-time Individual Reviews List */}
            <div>
              {productReviews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {productReviews.slice(0, 4).map((review) => (
                    <div key={review.id || Math.random()} className="bg-dark-800 border border-dark-600 rounded-xl p-6 transition-all flex flex-col">
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <HiStar key={i} className={`w-4 h-4 ${i < review.rating ? 'text-gold-500' : 'text-dark-500'}`} />
                        ))}
                      </div>
                      <p className="text-gray-300 italic mb-4 leading-relaxed flex-1 line-clamp-3">"{review.review_text}"</p>
                      <div className="flex items-center gap-3 border-t border-dark-600 pt-4 mt-auto">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-dark-600 bg-dark-700 shrink-0">
                          <img
                            src={review.image_url || getAvatarUrl(review.customer_name)}
                            alt={review.customer_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = getAvatarUrl(review.customer_name + '_alt'); }}
                          />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{review.customer_name}</p>
                          <div className="flex items-center gap-1 text-green-400 text-xs mt-0.5">
                            <HiCheckCircle className="w-3.5 h-3.5" />
                            Verified Buyer
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-dark-800/50 border border-dark-600 rounded-xl">
                  <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Help & Trust Center (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Style Heaven Trust Card */}
            <div className="border border-gold-500/20 bg-dark-800 rounded-2xl p-6 shadow-gold shadow-gold/5 space-y-5">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2 border-b border-dark-600 pb-3">
                <span className="text-gold-400">★</span> Style Heaven Assured
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                    <HiShieldCheck className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">100% Original Products</h4>
                    <p className="text-xs text-gray-400 mt-0.5">All garments are direct from our master designers and workshop tailors.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Free Cash on Delivery</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Pay in cash or UPI at delivery. No prepayment required for any order.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3.375"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">10-Day Worry-Free Returns</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Size not right? Return or exchange it within 10 days of delivery, hassle-free.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-bold text-white mb-4">Product & Order Help FAQs</h3>
              
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className="border border-dark-600 rounded-xl overflow-hidden bg-dark-800/30 transition-all hover:bg-dark-800/50"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex justify-between items-center p-4 text-left font-semibold text-sm text-gray-200 hover:text-white transition-colors focus:outline-none"
                    >
                      <span>{faq.q}</span>
                      <span className="text-gold-400 shrink-0 ml-2">
                        {isOpen ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        )}
                      </span>
                    </button>
                    
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-[200px] border-t border-dark-600/30' : 'max-h-0'
                      }`}
                    >
                      <div className="p-4 text-xs text-gray-400 leading-relaxed bg-dark-900/10">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-20 border-t border-dark-600 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-serif font-bold text-white">You May Also Like</h2>
          <div className="h-1 w-20 bg-gold-500 rounded-full mt-3" />
        </motion.div>

        {loadingRelated ? (
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[280px] md:min-w-[300px] snap-start">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="relative group">
            <div className="flex overflow-x-auto gap-6 pb-8 pt-4 px-2 -mx-2 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {relatedProducts.map((p, i) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="min-w-[260px] sm:min-w-[280px] md:min-w-[300px] snap-start"
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
            {/* Scroll hint gradient for desktop */}
            {relatedProducts.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-dark-900 to-transparent pointer-events-none hidden md:block z-10" />
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-10 bg-dark-800/50 rounded-xl border border-dark-600">
            No related products found in this category.
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        product={product}
        onReviewSubmitted={(newReview) => {
          // Instantly add the new review to the top of the list
          setProductReviews([newReview, ...productReviews]);
        }}
      />

      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        productCategory={product.category}
      />
    </div>
  );
}
