import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HiChartPie, HiCollection, HiSparkles, HiShoppingBag, HiCurrencyRupee, HiStar, HiUser, HiLogout, HiMenu, HiX } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function ArtisanLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: 'Dashboard',   path: '/artisan',           icon: HiChartPie },
    { name: 'My Products', path: '/artisan/products',  icon: HiCollection },
    { name: 'AI Studio ✨', path: '/artisan/ai-studio', icon: HiSparkles },
    { name: 'Orders',      path: '/artisan/orders',    icon: HiShoppingBag },
    { name: 'Earnings',    path: '/artisan/earnings',  icon: HiCurrencyRupee },
    { name: 'Profile',     path: '/artisan/profile',   icon: HiUser },
  ];

  const isActive = (path) => path === '/artisan' ? location.pathname === '/artisan' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={'fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-dark-800 border-r border-dark-600 transform transition-transform duration-300 ease-in-out ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-dark-600 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full ring-2 ring-gold-500/80 bg-gradient-luxury flex items-center justify-center text-dark-900 font-bold text-lg">K</div>
              <div className="leading-tight">
                <div className="font-serif text-lg font-bold gold-text">KalaStyle AI</div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Artisan Studio</div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><HiX className="w-6 h-6" /></button>
          </div>
          {user && (
            <div className="px-4 py-3 border-b border-dark-600 bg-dark-700/50">
              <p className="text-white font-semibold text-sm truncate">{user.name}</p>
              <p className="text-gold-400 text-xs">{user.artisan_profile?.store_name || 'Artisan'}</p>
              <span className={'text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block font-medium ' + (user.artisan_profile?.verification_status === 'verified' ? 'bg-green-500/20 text-green-400' : user.artisan_profile?.verification_status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')}>
                {user.artisan_profile?.verification_status === 'verified' ? '✓ Verified' : user.artisan_profile?.verification_status === 'rejected' ? '✗ Rejected' : '⏳ Pending Verification'}
              </span>
            </div>
          )}
          <nav className="flex-1 p-4 space-y-1">
            {links.map((l) => {
              const active = isActive(l.path);
              return (
                <Link key={l.name} to={l.path} onClick={() => setSidebarOpen(false)}
                  className={'admin-sidebar-item ' + (active ? 'active ' : '') + (l.path.includes('ai-studio') ? 'bg-gold-500/5 border border-gold-500/20' : '')}>
                  <l.icon className="w-5 h-5 shrink-0" />
                  {l.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-dark-600 space-y-2">
            <Link to="/products" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gold-400 transition-colors">← Back to Shop</Link>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors">
              <HiLogout className="w-5 h-5 shrink-0" /> Logout
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:hidden border-b border-dark-600 bg-dark-800 flex items-center px-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 p-2"><HiMenu className="w-6 h-6" /></button>
          <span className="ml-3 font-serif font-bold gold-text">Artisan Studio</span>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8"><Outlet /></div>
      </main>
    </div>
  );
}
