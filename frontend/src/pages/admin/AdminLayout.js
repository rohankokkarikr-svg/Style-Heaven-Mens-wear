import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  HiChartPie, 
  HiShoppingBag, 
  HiCollection, 
  HiTag,
  HiPhotograph,
  HiLogout,
  HiMenu,
  HiX,
  HiStar,
  HiCog
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: 'Dashboard',      path: '/admin',                icon: HiChartPie },
    { name: 'Products',       path: '/admin/products',       icon: HiCollection },
    { name: 'Orders',         path: '/admin/orders',         icon: HiShoppingBag },
    { name: 'Reviews',        path: '/admin/reviews',        icon: HiStar },
    { name: 'Hero Banners',   path: '/admin/hero-settings',  icon: HiPhotograph },
    { name: 'Discount Banner',path: '/admin/discount-banner',icon: HiTag },
    { name: 'Settings',       path: '/admin/settings',       icon: HiCog },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-dark-800 border-r border-dark-600 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-dark-600 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336535/style-heaven-assets/logo.png"
                alt="Style Heaven"
                className="h-10 w-10 object-contain rounded-full ring-2 ring-gold-500/80 shadow-gold"
              />
              <div className="leading-tight">
                <div className="font-serif text-xl font-bold gold-text">Style Heaven</div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Admin</div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {links.map((l) => {
              const active = location.pathname === l.path;
              return (
                <Link
                  key={l.name}
                  to={l.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`admin-sidebar-item ${active ? 'active' : ''}`}
                >
                  <l.icon className="w-5 h-5 shrink-0" />
                  {l.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-dark-600">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <HiLogout className="w-5 h-5 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:hidden border-b border-dark-600 bg-dark-800 flex items-center px-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 p-2">
            <HiMenu className="w-6 h-6" />
          </button>
          <img
            src="/logo.png"
            alt="Style Heaven"
            className="ml-4 h-8 w-8 object-contain rounded-full ring-2 ring-gold-500/80 shadow-gold"
          />
          <span className="ml-3 font-serif font-bold gold-text">Admin Panel</span>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
