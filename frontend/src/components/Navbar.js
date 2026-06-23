import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  HiShoppingCart, HiMenu, HiX, HiSearch, HiLogout,
  HiChartBar, HiStar
} from 'react-icons/hi';
import UserAvatar from './UserAvatar';


export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: 'Home',         href: '/' },
    { label: 'All',          href: '/products' },
    { label: 'T-Shirts',     href: '/products?category=T-Shirts' },
    { label: 'Shirts',       href: '/products?category=Shirts' },
    { label: 'Pants',        href: '/products?category=Pants' },
    { label: 'Jeans',        href: '/products?category=Jeans' },
    { label: 'Jackets',      href: '/products?category=Jackets' },
    { label: 'Suits',        href: '/products?category=Suits' },
    { label: 'Kurtas',       href: '/products?category=Kurtas' },
    { label: 'Accessories',  href: '/products?category=Accessories' },
  ];

  const isActive = (href) => location.pathname === href.split('?')[0];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-dark-900/95 backdrop-blur-md shadow-lg border-b border-dark-600' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336535/style-heaven-assets/logo.png"
                alt="Style Heaven"
                className="h-11 w-11 md:h-12 md:w-12 object-contain rounded-full ring-2 ring-gold-500/80 shadow-gold"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-lg md:text-xl font-bold gold-text">Style Heaven</span>
                <span className="text-[10px] md:text-xs text-gray-400 tracking-widest uppercase">Mens Wear</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.href}
                  className={`nav-link text-sm ${isActive(l.href) ? 'text-gold-400' : ''}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="btn-ghost p-2 rounded-lg"
                aria-label="Search"
              >
                <HiSearch className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link to="/cart" className="btn-ghost p-2 rounded-lg relative">
                <HiShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-dark-900 text-xs
                                   font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 btn-ghost p-1.5 rounded-lg">
                    <UserAvatar name={user.name} size={32} ring />
                    <span className="hidden md:block text-sm">{user.name?.split(' ')[0]}</span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-card
                                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                  transition-all duration-200 p-2">
                    <Link to="/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg
                                                  hover:bg-dark-600 text-sm text-gray-300 hover:text-white">
                      <HiShoppingCart className="w-4 h-4" /> My Orders
                    </Link>
                    <Link to="/rewards" className="flex items-center gap-2 px-3 py-2 rounded-lg
                                                   hover:bg-dark-600 text-sm text-gold-400 hover:text-gold-300">
                      <HiStar className="w-4 h-4" /> My Rewards
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg
                                                    hover:bg-dark-600 text-sm text-gold-400">
                        <HiChartBar className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg
                                 hover:bg-dark-600 text-sm text-red-400 hover:text-red-300"
                    >
                      <HiLogout className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-sm px-4 py-2">Sign In</Link>
              )}

              {/* Mobile Hamburger */}
              <button className="md:hidden btn-ghost p-2" onClick={() => setOpen(!open)}>
                {open ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-dark-600 bg-dark-900/95 px-4 py-3 animate-slide-up">
            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
              <input
                id="navbar-search"
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for shirts, trousers, accessories…"
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary px-5 py-3">Search</button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden border-t border-dark-600 bg-dark-900/98 px-4 py-4 animate-slide-up">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-gray-300 hover:text-gold-400 border-b border-dark-700"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
}
