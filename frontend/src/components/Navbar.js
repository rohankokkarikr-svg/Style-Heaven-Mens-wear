import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import {
  HiShoppingCart,
  HiHeart,
  HiMenu,
  HiX,
  HiSearch,
  HiLogout,
  HiChartBar,
  HiStar,
  HiChevronDown
} from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';
import UserAvatar from './UserAvatar';

const POPULAR_SEARCHES = [
  'Banarasi Silk Saree',
  'Mithila Madhubani Art',
  'Channapatna Wooden Toys',
  'Jaipur Blue Pottery',
  'Pashmina Shawl',
  'Dokra Brass Jewelry',
  'Assam Bamboo Basket',
  'Lucknowi Chikankari Kurta',
  'Terracotta Clay Pot',
  'Golden Jute Rug'
];

const HANDICRAFT_NAV_ITEMS = [
  { label: 'All Crafts', href: '/products', icon: '✨' },
  { label: 'Textiles & Handloom', href: '/products?category=Handloom+%26+Textiles', icon: '🧵' },
  { label: 'Home Décor', href: '/products?category=Home+D%C3%A9cor+%26+Furnishings', icon: '🏠' },
  { label: 'Jewelry & Accents', href: '/products?category=Handmade+Jewelry+%26+Accessories', icon: '💎' },
  { label: 'Pottery & Clay', href: '/products?category=Pottery+%26+Terracotta', icon: '🏺' },
  { label: 'Woodcraft', href: '/products?category=Wooden+Handicrafts', icon: '🪵' },
  { label: 'Paintings & Art', href: '/products?category=Traditional+Paintings+%26+Wall+Art', icon: '🖼️' },
  { label: 'Eco-Friendly', href: '/products?category=Eco-Friendly+%26+Natural+Products', icon: '🌿' },
];

export default function Navbar() {
  const { user, logout, isAdmin, isArtisan } = useAuth();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setMobileSearchOpen(false);
    }
  };

  const handleSuggestionClick = (term) => {
    setSearchQuery(term);
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
  };

  const isCurrentCategory = (href) => {
    if (href === '/products' && location.pathname === '/products' && !location.search) return true;
    if (href.includes('?category=')) {
      const catParam = new URLSearchParams(href.split('?')[1]).get('category');
      const curParam = new URLSearchParams(location.search).get('category');
      return curParam === catParam;
    }
    return false;
  };

  const filteredSuggestions = searchQuery.trim()
    ? POPULAR_SEARCHES.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : POPULAR_SEARCHES.slice(0, 6);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-dark-900/95 backdrop-blur-md shadow-xl border-b border-dark-700/80'
            : 'bg-gradient-to-b from-dark-950/90 via-dark-900/80 to-transparent backdrop-blur-sm'
        }`}
      >
        {/* Top Navbar Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* 1. Left: Brand Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative">
                <img
                  src="/images/kalastyle_logo.png"
                  alt="KalaStyle AI"
                  className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-full ring-2 ring-gold-500/80 shadow-gold group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500"></span>
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-lg md:text-2xl font-bold gold-text tracking-tight whitespace-nowrap">
                    KalaStyle AI
                  </span>
                </div>
                <span className="text-[9px] md:text-[10px] text-gray-400 tracking-widest uppercase font-semibold whitespace-nowrap">
                  Authentic Indian Handicrafts
                </span>
              </div>
            </Link>

            {/* 2. Center: Desktop Integrated Search Bar */}
            <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl mx-4 relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search Banarasi sarees, Madhubani art, Blue pottery, Brass..."
                    className="w-full bg-dark-800/90 hover:bg-dark-800 focus:bg-dark-800 border border-dark-600 focus:border-gold-500/80 rounded-full py-2.5 pl-11 pr-24 text-sm text-white placeholder-gray-400 focus:outline-none transition-all shadow-inner focus:ring-2 focus:ring-gold-500/20"
                  />
                  <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 w-5 h-5 pointer-events-none" />
                  
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gold-500 hover:bg-gold-400 text-dark-950 font-bold px-4 py-1.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-1 hover:shadow-gold"
                  >
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Search Suggestions Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-600 rounded-2xl shadow-2xl p-4 z-50 animate-slide-up backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gold-400 mb-2 flex items-center justify-between">
                    <span>🔥 Popular Handicraft Searches</span>
                    <span className="text-gray-500 text-[10px] lowercase">press enter to search</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredSuggestions.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSuggestionClick(term)}
                        className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-gold-500/20 text-gray-300 hover:text-gold-400 border border-dark-700 hover:border-gold-500/40 transition-all text-xs flex items-center gap-1.5"
                      >
                        <HiSearch className="w-3 h-3 text-gold-500" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Right: Action Icons & User Account */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Search Trigger */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-gold-400 hover:bg-dark-800 rounded-full transition-colors"
                aria-label="Search crafts"
              >
                <HiSearch className="w-5 h-5" />
              </button>

              {/* Wishlist Link */}
              <Link
                to="/wishlist"
                className="relative p-2 text-gray-300 hover:text-red-400 hover:bg-dark-800 rounded-full transition-all flex items-center justify-center group"
                aria-label="Wishlist"
                title="My Wishlist"
              >
                <HiHeart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {totalWishlistItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {totalWishlistItems}
                  </span>
                )}
              </Link>

              {/* Cart Link */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-300 hover:text-gold-400 hover:bg-dark-800 rounded-full transition-all flex items-center justify-center group"
                aria-label="Cart"
                title="My Shopping Cart"
              >
                <HiShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-dark-950 text-[10px] font-extrabold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow-gold">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Account / Sign In */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 pl-2 pr-3 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-full transition-all">
                    <UserAvatar name={user.name} size={28} ring />
                    <span className="hidden lg:block text-xs font-semibold text-gray-200">
                      {user.name?.split(' ')[0]}
                    </span>
                    <HiChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gold-400 transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Account Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-52 bg-dark-900/98 border border-dark-600 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-dark-700/80 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-gold-400 uppercase tracking-wider font-semibold">
                        {isAdmin ? '🛡️ Administrator' : isArtisan ? '🎨 Master Artisan' : '✨ Member'}
                      </p>
                    </div>

                    <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-dark-800 text-xs text-gold-400 font-semibold transition-colors">
                      <FaTrophy className="w-3.5 h-3.5" /> Artisan Leaderboard
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-dark-800 text-xs text-gray-300 hover:text-white transition-colors">
                      <HiHeart className="w-3.5 h-3.5 text-red-400" /> Saved Items ({totalWishlistItems})
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-dark-800 text-xs text-gray-300 hover:text-white transition-colors">
                      <HiShoppingCart className="w-3.5 h-3.5 text-gray-400" /> My Orders
                    </Link>
                    <Link to="/rewards" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-dark-800 text-xs text-gold-400 hover:text-gold-300 transition-colors">
                      <HiStar className="w-3.5 h-3.5 text-gold-400" /> Reward Coins
                    </Link>

                    {isArtisan && (
                      <Link to="/artisan" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold-500/20 text-xs text-gold-400 font-semibold border-t border-dark-700 mt-1 pt-2 transition-colors">
                        <span>🎨</span> Artisan Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold-500/20 text-xs text-gold-400 font-semibold border-t border-dark-700 mt-1 pt-2 transition-colors">
                        <HiChartBar className="w-3.5 h-3.5" /> Admin Portal
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-red-500/20 text-xs text-red-400 hover:text-red-300 border-t border-dark-700/80 mt-1 transition-colors"
                    >
                      <HiLogout className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-dark-950 font-bold text-xs px-4 py-2 rounded-full shadow-gold transition-all whitespace-nowrap"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-full transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileDrawerOpen ? <HiX className="w-6 h-6 text-gold-400" /> : <HiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Secondary Categories Navigation Bar (Desktop & Tablet) */}
          <div className="hidden md:flex items-center justify-between border-t border-dark-700/60 py-2.5 overflow-x-auto no-scrollbar gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  location.pathname === '/' && !location.search
                    ? 'bg-gold-500 text-dark-950 shadow-gold'
                    : 'text-gray-300 hover:text-gold-400 hover:bg-dark-800'
                }`}
              >
                🏠 Home
              </Link>
              {HANDICRAFT_NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isCurrentCategory(item.href)
                      ? 'bg-gold-500 text-dark-950 font-bold shadow-gold'
                      : 'text-gray-300 hover:text-gold-400 hover:bg-dark-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="shrink-0 pl-2">
              <Link
                to="/artisan/ai-studio"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-[11px] font-semibold transition-all whitespace-nowrap"
              >
                <span>🤖</span>
                <span>AI Artisan Studio</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-dark-700 bg-dark-950/98 px-4 py-3 shadow-2xl animate-slide-up">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center mb-2">
              <input
                ref={mobileSearchRef}
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Indian handicrafts, sarees, art..."
                className="w-full bg-dark-800 border border-dark-600 focus:border-gold-500 rounded-full py-2.5 pl-10 pr-20 text-xs text-white placeholder-gray-400 focus:outline-none"
              />
              <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-500 w-4 h-4" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gold-500 text-dark-950 font-bold px-3 py-1 rounded-full text-[11px]"
              >
                Search
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_SEARCHES.slice(0, 5).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSuggestionClick(term)}
                  className="px-2.5 py-1 rounded-full bg-dark-800 text-gray-300 text-[10px] border border-dark-700 hover:text-gold-400"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Slide-out Drawer */}
        <div
          className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
            mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileDrawerOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-screen bg-dark-950 border-r border-dark-700 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-900">
            <Link to="/" onClick={() => setMobileDrawerOpen(false)} className="flex items-center gap-2.5">
              <img
                src="/images/kalastyle_logo.png"
                alt="KalaStyle AI"
                className="h-8 w-8 object-cover rounded-full ring-2 ring-gold-500/80"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-base font-bold gold-text">KalaStyle AI</span>
                <span className="text-[8px] text-gray-400 uppercase tracking-widest">Handicrafts Market</span>
              </div>
            </Link>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              aria-label="Close menu"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="text-[10px] font-bold text-gold-400 uppercase tracking-widest px-3 py-1 mb-1">
              🇮🇳 Explore Handicrafts
            </div>

            <Link
              to="/"
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                location.pathname === '/' && !location.search
                  ? 'bg-gold-500 text-dark-950 font-bold'
                  : 'text-gray-300 hover:text-gold-400 hover:bg-dark-800'
              }`}
            >
              <span>🏠</span>
              <span>Home</span>
            </Link>

            {HANDICRAFT_NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  isCurrentCategory(item.href)
                    ? 'bg-gold-500 text-dark-950 font-bold'
                    : 'text-gray-300 hover:text-gold-400 hover:bg-dark-800'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="pt-3 border-t border-dark-800 mt-3">
              <Link
                to="/artisan/ai-studio"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold"
              >
                <span>🤖</span>
                <span>AI Artisan Studio</span>
              </Link>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-dark-700 bg-dark-900">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-dark-800 rounded-xl">
                  <UserAvatar name={user.name} size={36} ring />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-xs truncate">{user.name}</p>
                    <p className="text-[10px] text-gold-400 uppercase tracking-wider font-medium">
                      {isAdmin ? 'Admin' : isArtisan ? 'Artisan' : 'Member'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <HiLogout className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gold-500 text-dark-950 text-xs font-bold text-center block shadow-gold"
              >
                Sign In / Join as Artisan
              </Link>
            )}
          </div>
        </aside>
      </header>

      {/* Top Navbar Spacer to prevent content overlap */}
      <div className="h-16 md:h-28" />
    </>
  );
}
