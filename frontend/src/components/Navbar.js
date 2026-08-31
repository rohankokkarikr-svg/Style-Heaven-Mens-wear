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
  HiStar
} from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';
import UserAvatar from './UserAvatar';

const QUICK_SUGGESTIONS = [
  'Banarasi Saree',
  'Madhubani Painting',
  'Channapatna Wooden Toys',
  'Terracotta Pot',
  'Pashmina Shawl',
  'Jaipur Blue Pottery',
  'Bamboo Basket',
  'Dokra Tribal Jewelry',
  'Chikankari Kurta',
  'Jute Bag'
];

export default function Navbar() {
  const { user, logout, isAdmin, isArtisan } = useAuth();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleSuggestionClick = (term) => {
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'All Handicrafts', href: '/products' },
    { label: '🧵 Textiles', href: '/products?category=Handloom+%26+Textiles' },
    { label: '🏠 Home Décor', href: '/products?category=Home+D%C3%A9cor+%26+Furnishings' },
    { label: '💎 Jewelry', href: '/products?category=Handmade+Jewelry+%26+Accessories' },
    { label: '🏺 Pottery', href: '/products?category=Pottery+%26+Terracotta' },
    { label: '🪵 Woodcraft', href: '/products?category=Wooden+Handicrafts' },
    { label: '🖼️ Paintings', href: '/products?category=Traditional+Paintings+%26+Wall+Art' },
    { label: '🌿 Eco Natural', href: '/products?category=Eco-Friendly+%26+Natural+Products' },
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/' && !location.search;
    if (href.includes('?category=')) {
      const cat = new URLSearchParams(href.split('?')[1]).get('category');
      const curCat = new URLSearchParams(location.search).get('category');
      return curCat === cat;
    }
    return location.pathname === href && !location.search;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-dark-900/95 backdrop-blur-md shadow-lg border-b border-dark-600' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-3">
              <img
                src="/images/kalastyle_logo.png"
                alt="KalaStyle AI"
                className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-full ring-2 ring-gold-500/80 shadow-gold"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-base md:text-xl font-bold gold-text whitespace-nowrap">KalaStyle AI</span>
                <span className="text-[9px] md:text-xs text-gray-400 tracking-widest uppercase whitespace-nowrap">Artisan Marketplace</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-6">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.href}
                  className={`nav-link text-xs font-medium transition-colors ${
                    isActive(l.href) ? 'text-gold-400 font-semibold' : 'text-gray-300 hover:text-gold-400'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1.5 md:gap-3">
              {/* Search Toggle Button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="btn-ghost p-1.5 md:p-2 rounded-xl text-gray-300 hover:text-white"
                aria-label="Search"
              >
                <HiSearch className="w-5 h-5" />
              </button>

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="btn-ghost p-1.5 md:p-2 rounded-xl relative text-gray-300 hover:text-red-400"
                aria-label="Wishlist"
              >
                <HiHeart className="w-5 h-5" />
                {totalWishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {totalWishlistItems}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link to="/cart" className="btn-ghost p-1.5 md:p-2 rounded-xl relative text-gray-300 hover:text-gold-400" aria-label="Cart">
                <HiShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-dark-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Account / Auth */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 btn-ghost p-1.5 rounded-lg">
                    <UserAvatar name={user.name} size={32} ring />
                    <span className="hidden md:block text-xs font-medium">{user.name?.split(' ')[0]}</span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-600 text-xs text-gold-400 font-semibold">
                      <FaTrophy className="w-3.5 h-3.5 text-gold-400" /> Leaderboard
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-600 text-xs text-gray-300 hover:text-white">
                      <HiHeart className="w-3.5 h-3.5 text-red-400" /> My Wishlist
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-600 text-xs text-gray-300 hover:text-white">
                      <HiShoppingCart className="w-3.5 h-3.5" /> My Orders
                    </Link>
                    <Link to="/rewards" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-600 text-xs text-gold-400 hover:text-gold-300">
                      <HiStar className="w-3.5 h-3.5" /> My Rewards
                    </Link>
                    {isArtisan && (
                      <Link to="/artisan" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-600 text-xs text-gold-400 font-semibold border-t border-dark-500 mt-1 pt-2">
                        <span className="text-base">🎨</span> Artisan Studio
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-600 text-xs text-gold-400">
                        <HiChartBar className="w-3.5 h-3.5" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-dark-600 text-xs text-red-400 hover:text-red-300 border-t border-dark-600/60 mt-1"
                    >
                      <HiLogout className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 whitespace-nowrap">Sign In</Link>
              )}

              {/* Mobile Hamburger */}
              <button className="xl:hidden btn-ghost p-1.5" onClick={() => setOpen(!open)} aria-label="Open menu">
                {open ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar with Live Suggestions */}
        {searchOpen && (
          <div className="border-t border-dark-600 bg-dark-900/98 px-4 py-4 shadow-2xl animate-slide-up">
            <div className="max-w-2xl mx-auto space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Banarasi saree, Madhubani art, Channapatna toy, pottery..."
                    className="w-full bg-dark-800 border border-dark-600 focus:border-gold-500 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner"
                  />
                  <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button type="submit" className="btn-gold px-6 py-3 text-xs font-bold uppercase tracking-wider">
                  Search
                </button>
              </form>

              {/* Quick Search Tags */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <span className="text-gray-400 font-medium">Popular:</span>
                {QUICK_SUGGESTIONS.slice(0, 6).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSuggestionClick(term)}
                    className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-gold-500/20 text-gray-300 hover:text-gold-400 border border-dark-700 hover:border-gold-500/40 transition-all text-[11px]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Slide-out Drawer Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
            open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setOpen(false)}
        />

        {/* Mobile Slide-out Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-screen bg-dark-900 border-r border-dark-600 flex flex-col transform transition-transform duration-300 ease-in-out xl:hidden ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-600 bg-dark-950">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <img
                src="/images/kalastyle_logo.png"
                alt="KalaStyle AI"
                className="h-8 w-8 object-cover rounded-full ring-2 ring-gold-500/80"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm font-bold gold-text whitespace-nowrap">KalaStyle AI</span>
                <span className="text-[8px] text-gray-400 tracking-widest uppercase whitespace-nowrap">Artisan Marketplace</span>
              </div>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="btn-ghost p-1 rounded-lg text-gray-400 hover:text-white"
              aria-label="Close menu"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          {/* Links */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
            <div className="text-[10px] font-bold text-gold-400 uppercase tracking-widest px-3 py-1">
              Indian Handicrafts
            </div>
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                onClick={() => setOpen(false)}
                className={`block py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  isActive(l.href)
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'text-gray-300 hover:text-gold-400 hover:bg-dark-800'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-dark-600 bg-dark-950">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 flex items-center gap-3 mb-2 bg-dark-800/50 rounded-xl">
                  <UserAvatar name={user.name} size={36} ring />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {isAdmin ? 'Admin' : isArtisan ? 'Artisan' : 'Member'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/wishlist"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-dark-800"
                >
                  <HiHeart className="w-4 h-4 text-red-400" />
                  <span>My Wishlist ({totalWishlistItems})</span>
                </Link>

                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-dark-800"
                >
                  <HiLogout className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="btn-gold w-full text-center py-2.5 text-xs font-semibold block"
              >
                Sign In / Join as Artisan
              </Link>
            )}
          </div>
        </aside>
      </nav>
    </>
  );
}
