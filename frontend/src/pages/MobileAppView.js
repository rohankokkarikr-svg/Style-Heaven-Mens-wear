import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiViewGrid,
  HiSearch,
  HiShoppingCart,
  HiUser,
  HiHeart,
  HiArrowLeft,
  HiX,
  HiCheck,
  HiClipboardCopy,
  HiSparkles,
  HiLockClosed,
  HiShieldCheck,
  HiTag,
  HiChevronRight,
  HiRefresh,
  HiStar,
  HiClock,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings, DEFAULT_HERO_SLIDES, DEFAULT_DISCOUNT_BANNER } from '../context/SettingsContext';
import { productAPI, orderAPI, couponAPI, artisanAPI } from '../services/api';
import { HANDICRAFT_CATEGORIES, HANDICRAFT_PRODUCTS } from '../constants/handicraftsData';
import toast from 'react-hot-toast';

export default function MobileAppView() {
  const { user, isAuthenticated, login, signup, logout } = useAuth();
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();

  // Navigation State inside the Mobile App Simulator
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'categories' | 'search' | 'cart' | 'profile'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Sub-Screens
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // Products & Artisans Data
  const [products, setProducts] = useState(HANDICRAFT_PRODUCTS);
  const [featured, setFeatured] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Checkout Form State
  const [shippingName, setShippingName] = useState(user?.name || '');
  const [shippingPhone, setShippingPhone] = useState(user?.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // UPI Payment State
  const [utrRefNo, setUtrRefNo] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrSubmitted, setUtrSubmitted] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: feat } = await productAPI.getFeatured();
        if (Array.isArray(feat) && feat.length > 0) setFeatured(feat);
        else setFeatured(HANDICRAFT_PRODUCTS.slice(0, 8));
      } catch {
        setFeatured(HANDICRAFT_PRODUCTS.slice(0, 8));
      }

      try {
        const { data: prods } = await productAPI.getAll();
        if (Array.isArray(prods) && prods.length > 0) setProducts(prods);
      } catch {}

      try {
        const { data: arts } = await artisanAPI.getAll();
        if (Array.isArray(arts)) setArtisans(arts.slice(0, 6));
      } catch {}
    };
    loadData();
  }, []);

  // Fetch orders when user opens orders
  useEffect(() => {
    if (showOrders && isAuthenticated) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const { data } = await orderAPI.getMyOrders();
          if (Array.isArray(data)) setMyOrders(data);
        } catch {}
        setLoadingOrders(false);
      };
      fetchOrders();
    }
  }, [showOrders, isAuthenticated]);

  // Discount Calculation
  const subtotal = totalPrice;
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.discount_value) / 100);
    } else {
      discountAmount = Math.min(appliedCoupon.discount_value, subtotal);
    }
  }
  const deliveryFee = subtotal === 0 || subtotal >= 1500 || appliedCoupon?.discount_type === 'free_shipping' ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'KALA30') {
      setAppliedCoupon({ code: 'KALA30', discount_type: 'percentage', discount_value: 30 });
      setCouponCode('');
      toast.success('30% Launch Discount Applied! 🏷️');
      return;
    }
    toast.error('Invalid coupon code. Try KALA30');
  };

  // Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingPincode) {
      toast.error('Please fill in all address fields');
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSubmittingOrder(true);
    try {
      const fullAddress = `${shippingName}, ${shippingAddress}, ${shippingCity} - ${shippingPincode}`;
      const payload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity || 1,
          price_at_time: i.product.price,
          size: i.size || 'Standard',
        })),
        total_price: grandTotal,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon?.code || null,
        shipping_address: fullAddress,
        phone: shippingPhone.replace(/\D/g, '').slice(0, 10),
        payment_method: paymentMethod === 'upi' ? 'upi' : 'cod',
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending_verification',
      };

      const res = await orderAPI.create(payload);
      const created = res.data;
      clearCart();
      setShowCheckout(false);

      if (paymentMethod === 'upi') {
        setActiveOrder(created);
        setShowPaymentGateway(true);
      } else {
        toast.success('🎉 Order Placed Successfully!');
        setShowOrders(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Submit UTR
  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    const clean = utrRefNo.replace(/\D/g, '').trim();
    if (!clean || clean.length < 6) {
      toast.error('Please enter a valid 12-digit UTR / Ref. No.');
      return;
    }
    setSubmittingUtr(true);
    try {
      await orderAPI.pay(activeOrder.id, {
        payment_method: 'upi_phonepe',
        transaction_id: clean,
        ref_no: clean,
      });
      setUtrSubmitted(true);
      toast.success('Payment Ref. No. submitted for Verification! ⏳');
    } catch (err) {
      toast.error('Failed to submit UTR');
    } finally {
      setSubmittingUtr(false);
    }
  };

  // Filtered Products for Products Tab & Search
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (activeCategory !== 'all') {
      list = list.filter(
        (p) =>
          (p.category || '').toLowerCase() === activeCategory.toLowerCase() ||
          (p.subcategory || '').toLowerCase() === activeCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.material || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-2 sm:p-6 font-sans">
      {/* Top Banner Notice */}
      <div className="text-center mb-4 max-w-lg">
        <div className="inline-flex items-center gap-2 bg-gold-500/15 border border-gold-500/30 px-3 py-1 rounded-full text-gold-400 text-xs font-bold uppercase tracking-wider mb-2">
          📱 Live Mobile App Screen Simulator
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
          Style Heaven Mens — Mobile Application Preview
        </h1>
        <p className="text-gray-400 text-xs mt-1">
          Fully functional mobile-first UI with native tabs, touch-friendly controls, direct artisan UPI, and instant cart checkout.
        </p>
      </div>

      {/* Realistic Mobile Device Container */}
      <div className="w-full max-w-[420px] h-[840px] bg-dark-900 rounded-[44px] border-[8px] border-dark-700 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-gold-500/30">
        
        {/* Device Speaker Notch & Status Bar */}
        <div className="bg-dark-950 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-semibold text-gray-300 border-b border-dark-800 shrink-0 z-30">
          <span>9:41</span>
          <div className="w-20 h-4 bg-dark-800 rounded-full mx-auto -mt-1" />
          <div className="flex items-center gap-1.5 text-xs text-gold-400">
            <span>5G</span>
            <span>100% 🔋</span>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="bg-dark-900 px-4 py-3 border-b border-dark-700 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-sm font-bold text-gold-400">
              👑
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Style Heaven Mens</h2>
              <p className="text-[10px] text-gold-400 font-semibold uppercase tracking-wider">Handcrafted Menswear</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWishlist(true)}
              className="relative p-2 rounded-xl bg-dark-800 border border-dark-700 text-gold-400 hover:bg-dark-700"
            >
              <HiHeart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className="relative p-2 rounded-xl bg-dark-800 border border-dark-700 text-gold-400 hover:bg-dark-700"
            >
              <HiShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 text-dark-900 text-[9px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Mobile Screen Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto bg-dark-950 pb-20">
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="p-3 space-y-4">
              {/* Hero Banner Slider */}
              <div className="relative h-44 rounded-2xl overflow-hidden border border-gold-500/40 shadow-lg bg-dark-800">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop"
                  alt="Royal Handloom Menswear"
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent p-4 flex flex-col justify-end">
                  <span className="bg-gold-500 text-dark-900 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded w-fit mb-1">
                    ★ Royal Handloom Craft
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">
                    Redefine Your Style With Generational Weaves
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Banarasi silks, Nehru jackets & artisanal accessories.
                  </p>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="mt-2 text-xs font-bold text-gold-400 flex items-center gap-1 hover:underline"
                  >
                    Explore Collection →
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => { setActiveCategory('all'); setActiveTab('categories'); }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-gold-500 text-dark-900 whitespace-nowrap"
                >
                  ✨ All Crafts
                </button>
                {HANDICRAFT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.slug); setActiveTab('categories'); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-dark-850 border border-dark-700 text-gray-300 whitespace-nowrap hover:border-gold-500/50"
                  >
                    {cat.icon || '🧵'} {cat.name}
                  </button>
                ))}
              </div>

              {/* Promo Discount Banner Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-dark-850 to-dark-800 border border-gold-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gold-400">🏷️ CODE: KALA30</span>
                    <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">30% OFF</span>
                  </div>
                  <p className="text-xs text-gray-200 font-semibold mt-1">Special Artisan Launch Deal</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText('KALA30'); toast.success('Code KALA30 copied! 📋'); }}
                  className="px-3 py-1.5 rounded-xl bg-gold-500 text-dark-900 text-xs font-bold"
                >
                  Copy Code
                </button>
              </div>

              {/* Featured Products Grid */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-sm font-bold text-white">Featured Masterpieces</h3>
                  <button onClick={() => setActiveTab('categories')} className="text-xs text-gold-400 font-semibold">
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {featured.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setSelectedSize(p.sizes?.[0] || 'M'); }}
                      className="bg-dark-900 border border-dark-700 rounded-2xl p-2 cursor-pointer hover:border-gold-500/50 transition-all flex flex-col justify-between"
                    >
                      <div className="relative h-32 rounded-xl overflow-hidden bg-dark-800 mb-2">
                        <img src={p.image_url || p.image} alt={p.name} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-dark-950/80 flex items-center justify-center text-xs"
                        >
                          {isInWishlist(p.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <div>
                        <p className="text-[10px] text-gold-400 font-bold uppercase truncate">{p.category}</p>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-black text-gold-400">₹{p.price?.toLocaleString()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, p.sizes?.[0] || 'Standard', 1);
                              toast.success('Added to Cart 🛒');
                            }}
                            className="w-6 h-6 rounded-lg bg-gold-500 text-dark-900 font-black flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meet Master Artisans */}
              {artisans.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 px-1">Meet the Artisans 🧑‍🎨</h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {artisans.map((a) => (
                      <div key={a.id} className="min-w-[130px] bg-dark-850 border border-dark-700 p-3 rounded-2xl text-center">
                        <div className="w-11 h-11 rounded-full bg-gold-500/20 border border-gold-500 text-gold-400 font-bold flex items-center justify-center mx-auto mb-1.5 text-base">
                          {(a.store_name || 'A')[0]}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{a.store_name}</h4>
                        <p className="text-[10px] text-gold-400">{a.specialization || 'Master Weaver'}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">📍 {a.location || 'India'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORIES & CATALOG */}
          {activeTab === 'categories' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-white">Artisanal Catalog ({filteredProducts.length})</h3>
                {activeCategory !== 'all' && (
                  <button onClick={() => setActiveCategory('all')} className="text-xs text-gold-400 font-bold">
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Category selector pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    activeCategory === 'all' ? 'bg-gold-500 text-dark-900' : 'bg-dark-850 text-gray-400'
                  }`}
                >
                  All ({products.length})
                </button>
                {HANDICRAFT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      activeCategory === cat.slug ? 'bg-gold-500 text-dark-900' : 'bg-dark-850 text-gray-400'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Products List Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setSelectedSize(p.sizes?.[0] || 'M'); }}
                    className="bg-dark-900 border border-dark-700 rounded-2xl p-2 cursor-pointer hover:border-gold-500/50 transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-32 rounded-xl overflow-hidden bg-dark-800 mb-2">
                      <img src={p.image_url || p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gold-400 font-bold uppercase truncate">{p.category}</p>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-black text-gold-400">₹{p.price?.toLocaleString()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, p.sizes?.[0] || 'Standard', 1);
                            toast.success('Added to Cart 🛒');
                          }}
                          className="w-6 h-6 rounded-lg bg-gold-500 text-dark-900 font-black flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SEARCH */}
          {activeTab === 'search' && (
            <div className="p-3 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search kurtas, jackets, handlooms..."
                  className="w-full bg-dark-850 border border-dark-700 rounded-2xl py-2.5 pl-9 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
                <HiSearch className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-xs text-gray-500">
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Suggestion Chips */}
              {!searchQuery && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">Trending Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Banarasi Silk', 'Nehru Jacket', 'Cufflinks', 'Khadi', 'Hand-block Print'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-2.5 py-1 rounded-xl bg-dark-850 border border-dark-700 text-xs text-gray-300 hover:border-gold-500"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-2">Results: {filteredProducts.length} items</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setSelectedSize(p.sizes?.[0] || 'M'); }}
                      className="bg-dark-900 border border-dark-700 rounded-2xl p-2 cursor-pointer hover:border-gold-500/50 transition-all flex flex-col justify-between"
                    >
                      <div className="relative h-28 rounded-xl overflow-hidden bg-dark-800 mb-2">
                        <img src={p.image_url || p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                        <span className="text-xs font-black text-gold-400 mt-1 block">₹{p.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CART */}
          {activeTab === 'cart' && (
            <div className="p-3 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-white">Your Shopping Cart ({totalItems})</h3>
                {items.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-red-400 font-bold">
                    Clear All
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-16 bg-dark-900 rounded-3xl border border-dark-800 p-6">
                  <div className="text-4xl mb-2">🛒</div>
                  <h4 className="text-sm font-bold text-white">Your Cart is Empty</h4>
                  <p className="text-xs text-gray-400 mt-1">Explore our handcrafted menswear and add your favorites.</p>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="mt-4 px-4 py-2 rounded-xl bg-gold-500 text-dark-900 text-xs font-bold"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((i) => (
                    <div key={i.key} className="bg-dark-900 border border-dark-700 p-2.5 rounded-2xl flex gap-3 items-center">
                      <img
                        src={i.product.image_url || i.product.image}
                        alt={i.product.name}
                        className="w-16 h-18 rounded-xl object-cover bg-dark-800"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white line-clamp-1">{i.product.name}</h4>
                          <button onClick={() => removeFromCart(i.key)} className="text-xs text-gray-500 hover:text-red-400">
                            ✕
                          </button>
                        </div>
                        <span className="text-[10px] bg-dark-800 text-gold-400 px-1.5 py-0.5 rounded font-bold">
                          Size: {i.size}
                        </span>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-bold text-gold-400">
                            ₹{((i.product.price || 0) * (i.quantity || 1)).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-lg px-2 py-0.5">
                            <button onClick={() => updateQuantity(i.key, (i.quantity || 1) - 1)} className="text-gold-400 text-xs font-bold">
                              -
                            </button>
                            <span className="text-xs font-bold text-white">{i.quantity}</span>
                            <button onClick={() => updateQuantity(i.key, (i.quantity || 1) + 1)} className="text-gold-400 text-xs font-bold">
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Coupon Input */}
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter promo code (e.g. KALA30)"
                      className="flex-1 bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-gold-500"
                    />
                    <button type="submit" className="px-4 py-2 bg-gold-500 text-dark-900 font-bold rounded-xl text-xs">
                      Apply
                    </button>
                  </form>

                  {/* Bill Details */}
                  <div className="bg-dark-900 border border-dark-700 p-3 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Item Subtotal:</span>
                      <span className="text-white font-semibold">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-400 font-semibold">
                        <span>Coupon Discount:</span>
                        <span>-₹{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-400">
                      <span>Delivery Fee:</span>
                      <span className="text-green-400">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                    </div>
                    <div className="border-t border-dark-700 pt-1.5 flex justify-between text-sm font-bold text-gold-400">
                      <span>Total Amount:</span>
                      <span className="text-base font-black">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-3 bg-gradient-luxury text-dark-900 font-black rounded-2xl text-xs shadow-gold tracking-wide"
                  >
                    Proceed to Checkout (₹{grandTotal.toLocaleString()}) →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-3 space-y-3">
              <div className="bg-dark-900 border border-gold-500/30 p-4 rounded-3xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold-500/20 border border-gold-500 flex items-center justify-center text-xl font-bold text-gold-400">
                  {isAuthenticated ? (user?.name?.[0] || 'U') : '👤'}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">
                    {isAuthenticated ? user.name : 'Guest Customer'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isAuthenticated ? `+91 ${user.phone || user.email}` : 'Login to track orders & rewards'}
                  </p>
                </div>
              </div>

              {/* Profile Menu Links */}
              <div className="bg-dark-900 border border-dark-700 rounded-3xl overflow-hidden divide-y divide-dark-800">
                <button
                  onClick={() => {
                    if (!isAuthenticated) setShowAuthModal(true);
                    else setShowOrders(true);
                  }}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-white hover:bg-dark-850"
                >
                  <span className="flex items-center gap-2">📦 My Orders</span>
                  <HiChevronRight className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowWishlist(true)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-white hover:bg-dark-850"
                >
                  <span className="flex items-center gap-2">❤️ My Wishlist ({wishlist.length})</span>
                  <HiChevronRight className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowSpinWheel(true)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-gold-400 hover:bg-dark-850"
                >
                  <span className="flex items-center gap-2">🎡 Daily Spin to Win Rewards</span>
                  <span className="text-[10px] bg-gold-500 text-dark-900 px-1.5 py-0.5 rounded font-black">SPIN</span>
                </button>
                <a
                  href="https://wa.me/917676558335?text=Hello%20Style%20Heaven%20Mens"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-green-400 hover:bg-dark-850"
                >
                  <span className="flex items-center gap-2">💬 WhatsApp Styling Support</span>
                  <HiChevronRight className="w-4 h-4 text-gray-500" />
                </a>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="w-full py-2.5 bg-red-600/20 border border-red-500/40 text-red-400 rounded-2xl text-xs font-bold"
                >
                  Logout from Account 🚪
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-3 bg-gold-500 text-dark-900 rounded-2xl text-xs font-black"
                >
                  Login or Sign Up
                </button>
              )}
            </div>
          )}
        </div>

        {/* Floating Bottom Tab Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-md border-t border-dark-700 px-4 py-2 flex items-center justify-between z-20">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' ? 'text-gold-400 font-bold' : 'text-gray-400'}`}
          >
            <HiHome className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'categories' ? 'text-gold-400 font-bold' : 'text-gray-400'}`}
          >
            <HiViewGrid className="w-5 h-5" />
            <span className="text-[10px]">Categories</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'search' ? 'text-gold-400 font-bold' : 'text-gray-400'}`}
          >
            <HiSearch className="w-5 h-5" />
            <span className="text-[10px]">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex flex-col items-center gap-0.5 relative ${activeTab === 'cart' ? 'text-gold-400 font-bold' : 'text-gray-400'}`}
          >
            <HiShoppingCart className="w-5 h-5" />
            <span className="text-[10px]">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 right-1 w-3.5 h-3.5 rounded-full bg-gold-500 text-dark-900 text-[8px] font-black flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'profile' ? 'text-gold-400 font-bold' : 'text-gray-400'}`}
          >
            <HiUser className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>

        {/* MODAL: PRODUCT DETAILS */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-dark-950 z-40 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-3 bg-dark-900 border-b border-dark-700 flex items-center justify-between">
                <button onClick={() => setSelectedProduct(null)} className="text-gold-400 text-xs font-bold flex items-center gap-1">
                  <HiArrowLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-xs font-bold text-white truncate max-w-[200px]">{selectedProduct.name}</span>
                <button onClick={() => toggleWishlist(selectedProduct)} className="text-base">
                  {isInWishlist(selectedProduct.id) ? '❤️' : '🤍'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="h-64 rounded-2xl overflow-hidden bg-dark-900 border border-dark-700">
                  <img
                    src={selectedProduct.image_url || selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <span className="text-[10px] bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{selectedProduct.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-black text-gold-400">₹{selectedProduct.price?.toLocaleString()}</span>
                    {selectedProduct.original_price && (
                      <span className="text-xs text-gray-500 line-through">₹{selectedProduct.original_price?.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* Size Selector */}
                <div>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Select Size</p>
                  <div className="flex gap-2">
                    {(selectedProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold border ${
                          selectedSize === s ? 'bg-gold-500 text-dark-900 border-gold-400' : 'bg-dark-850 text-gray-300 border-dark-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-dark-900 border border-dark-800 p-3 rounded-2xl">
                  <p className="text-xs font-bold text-gold-400 uppercase mb-1">Craft Description</p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {selectedProduct.description || 'Authentic handcrafted Indian menswear made with generational artisan techniques.'}
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-3 bg-dark-900 border-t border-dark-700 flex gap-2">
                <button
                  onClick={() => {
                    addToCart(selectedProduct, selectedSize, quantity);
                    toast.success('Added to Cart! 🛒');
                  }}
                  className="flex-1 py-3 bg-dark-800 border border-gold-500 text-gold-400 font-bold rounded-2xl text-xs"
                >
                  Add to Cart 🛒
                </button>
                <button
                  onClick={() => {
                    addToCart(selectedProduct, selectedSize, quantity);
                    setSelectedProduct(null);
                    setShowCheckout(true);
                  }}
                  className="flex-1 py-3 bg-gradient-luxury text-dark-900 font-black rounded-2xl text-xs shadow-gold"
                >
                  Buy Now ⚡
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: CHECKOUT */}
        <AnimatePresence>
          {showCheckout && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute inset-0 bg-dark-950 z-40 flex flex-col"
            >
              <div className="p-3 bg-dark-900 border-b border-dark-700 flex items-center justify-between">
                <button onClick={() => setShowCheckout(false)} className="text-gold-400 text-xs font-bold flex items-center gap-1">
                  <HiArrowLeft className="w-4 h-4" /> Back to Cart
                </button>
                <span className="text-xs font-bold text-white">Mobile Checkout</span>
                <span className="w-4" />
              </div>

              <form onSubmit={handlePlaceOrder} className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="bg-dark-900 border border-dark-700 p-3 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-gold-400 uppercase">1. Delivery Address</p>
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="w-full bg-dark-850 border border-dark-700 rounded-xl p-2.5 text-xs text-white"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number (10 digits) *"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full bg-dark-850 border border-dark-700 rounded-xl p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Address (House/Street/Area) *"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-dark-850 border border-dark-700 rounded-xl p-2.5 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City *"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="bg-dark-850 border border-dark-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="PIN Code *"
                      value={shippingPincode}
                      onChange={(e) => setShippingPincode(e.target.value)}
                      className="bg-dark-850 border border-dark-700 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Payment Selector */}
                <div className="bg-dark-900 border border-dark-700 p-3 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-gold-400 uppercase">2. Payment Method</p>
                  <label
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer ${
                      paymentMethod === 'upi' ? 'bg-gold-500/15 border-gold-500 text-gold-400' : 'bg-dark-850 border-dark-700 text-gray-300'
                    }`}
                  >
                    <span className="text-xs font-bold">⚡ Direct Artisan UPI (0% Fee)</span>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">Recommended</span>
                  </label>
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer ${
                      paymentMethod === 'cod' ? 'bg-gold-500/15 border-gold-500 text-gold-400' : 'bg-dark-850 border-dark-700 text-gray-300'
                    }`}
                  >
                    <span className="text-xs font-bold">💵 Cash on Delivery (COD)</span>
                  </label>
                </div>

                {/* Total */}
                <div className="bg-dark-900 border border-dark-700 p-3 rounded-2xl flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total Payable Amount:</span>
                  <span className="text-base font-black text-gold-400">₹{grandTotal.toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3 bg-gradient-luxury text-dark-900 font-black rounded-2xl text-xs shadow-gold"
                >
                  {submittingOrder ? 'Placing Order...' : `Confirm Order (₹${grandTotal.toLocaleString()}) 🚀`}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: DIRECT ARTISAN UPI PAYMENT GATEWAY */}
        <AnimatePresence>
          {showPaymentGateway && activeOrder && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute inset-0 bg-dark-950 z-50 flex flex-col"
            >
              <div className="p-3 bg-dark-900 border-b border-dark-700 flex items-center justify-between">
                <button onClick={() => { setShowPaymentGateway(false); setShowOrders(true); }} className="text-gold-400 text-xs font-bold flex items-center gap-1">
                  <HiArrowLeft className="w-4 h-4" /> My Orders
                </button>
                <span className="text-xs font-bold text-white">Artisan UPI Gateway</span>
                <span className="w-4" />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-center">
                {!utrSubmitted ? (
                  <>
                    <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-2xl border-2 border-gold-500">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=7349083982@upi%26pn=StyleHeavenMens%26am=${activeOrder.total_price}%26cu=INR`}
                        alt="UPI QR Code"
                        className="w-44 h-44 mx-auto rounded"
                      />
                      <p className="text-[11px] font-bold text-gray-900 mt-2">Scan using PhonePe · GPay · Paytm</p>
                    </div>

                    <div className="bg-dark-900 border border-dark-700 p-3 rounded-2xl text-left space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Payee UPI ID:</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText('7349083982@upi'); toast.success('UPI ID Copied! 📋'); }}
                          className="text-gold-400 font-bold bg-dark-800 px-2 py-1 rounded"
                        >
                          7349083982@upi 📋
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Amount:</span>
                        <span className="text-gold-400 font-black text-sm">₹{activeOrder.total_price?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Submit UTR */}
                    <form onSubmit={handleSubmitUtr} className="space-y-2 text-left">
                      <label className="text-xs font-bold text-gray-300 uppercase">Step 2: Enter 12-digit UTR / Ref. No.</label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        value={utrRefNo}
                        onChange={(e) => setUtrRefNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder="e.g. 423198765432"
                        className="w-full bg-dark-900 border border-gold-500 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                      <button
                        type="submit"
                        disabled={submittingUtr}
                        className="w-full py-3 bg-gold-500 text-dark-900 font-black rounded-xl text-xs"
                      >
                        {submittingUtr ? 'Submitting...' : 'Submit Ref. No. for Verification 🚀'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="text-4xl">⏳</div>
                    <h3 className="text-base font-bold text-white">Payment Ref. No. Submitted!</h3>
                    <p className="text-xs text-gold-400 bg-gold-500/20 px-3 py-1 rounded-full inline-block font-bold">
                      Pending Admin Verification
                    </p>
                    <p className="text-xs text-gray-400 px-4">
                      Thank you! Your order #{activeOrder.id?.substring(0, 8)} is confirmed and will be processed immediately.
                    </p>
                    <button
                      onClick={() => { setShowPaymentGateway(false); setShowOrders(true); }}
                      className="w-full py-2.5 bg-dark-800 border border-dark-600 text-white rounded-xl text-xs font-bold mt-4"
                    >
                      View in My Orders
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: MY ORDERS */}
        <AnimatePresence>
          {showOrders && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute inset-0 bg-dark-950 z-40 flex flex-col"
            >
              <div className="p-3 bg-dark-900 border-b border-dark-700 flex items-center justify-between">
                <button onClick={() => setShowOrders(false)} className="text-gold-400 text-xs font-bold flex items-center gap-1">
                  <HiArrowLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-xs font-bold text-white">Order History</span>
                <span className="w-4" />
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loadingOrders ? (
                  <div className="text-center py-10 text-xs text-gray-400">Loading orders...</div>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-16 text-xs text-gray-400">No orders placed yet.</div>
                ) : (
                  myOrders.map((ord) => (
                    <div key={ord.id} className="bg-dark-900 border border-dark-700 p-3 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gold-400">#{ord.id?.substring(0, 8)}</span>
                        <span className="bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{ord.shipping_address}</p>
                      <div className="flex justify-between items-center border-t border-dark-800 pt-2 text-xs">
                        <span className="text-gray-300 font-bold">Total: ₹{ord.total_price?.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-500">{new Date(ord.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: DAILY SPIN TO WIN */}
        <AnimatePresence>
          {showSpinWheel && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0 bg-dark-950/95 backdrop-blur-md z-50 p-6 flex flex-col items-center justify-center text-center"
            >
              <button onClick={() => setShowSpinWheel(false)} className="absolute top-4 right-4 text-gray-400 text-lg">
                ✕
              </button>
              <div className="text-5xl mb-2 animate-bounce">🎡</div>
              <h3 className="text-lg font-bold text-gold-400">Spin & Win Daily Rewards</h3>
              <p className="text-xs text-gray-300 mt-1 mb-4">
                Win exclusive discount vouchers, free shipping, and gift cards!
              </p>
              <div className="w-48 h-48 rounded-full border-4 border-gold-500 flex items-center justify-center bg-dark-900 shadow-gold">
                <span className="text-xs font-black text-gold-400">🎉 FLAT 30% OFF</span>
              </div>
              <button
                onClick={() => {
                  toast.success('🎉 You won 30% OFF! Code: KALA30');
                  setShowSpinWheel(false);
                }}
                className="mt-6 w-full py-3 bg-gradient-luxury text-dark-900 font-black rounded-2xl text-xs shadow-gold"
              >
                Claim My Reward 🎁
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
