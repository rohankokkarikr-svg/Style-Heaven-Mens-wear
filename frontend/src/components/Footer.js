import React from 'react';
import { Link } from 'react-router-dom';
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const year = new Date().getFullYear();
  const { settings } = useSettings();

  const {
    storeName       = 'Style Heaven',
    supportEmail    = 'support@styleheaven.com',
    supportPhone    = '+91 7676558335',
    storeAddress    = "Style heaven men's Wear, L. E, T College Road, near Wali Complex, Gokak, Karnataka 591307",
    instagramUrl    = 'https://www.instagram.com/style_heaven_mens_wear?igsh=MXVueXV5ejc1bXVvNQ==',
    whatsappNumber  = '917676558335',
    footerTagline   = "Redefining men's fashion with premium quality fabrics, timeless designs, and unmatched elegance.",
  } = settings;

  return (
    <footer className="bg-dark-800 border-t border-dark-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336535/style-heaven-assets/logo.png"
                alt={storeName}
                className="h-12 w-12 object-contain rounded-full ring-2 ring-gold-500/80 shadow-gold"
              />
              <div>
                <span className="font-serif text-2xl font-bold gold-text">{storeName}</span>
                <p className="text-xs text-gray-500 tracking-widest uppercase mt-0.5">Mens Wear</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              {footerTagline}
            </p>
            <div className="flex gap-4">
              {[
                { icon: FaInstagram, href: instagramUrl,                      color: 'hover:text-pink-400' },
                { icon: FaWhatsapp,  href: `https://wa.me/${whatsappNumber}`, color: 'hover:text-green-400' },
              ].map(({ icon: Icon, href, color }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                   className={`text-gray-500 ${color} transition-colors duration-200`}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home',      href: '/' },
                { label: 'Shop',      href: '/products' },
                { label: 'My Orders', href: '/orders' },
                { label: 'Cart',      href: '/cart' },
                { label: 'Login',     href: '/login' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-gray-400 hover:text-gold-400 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <HiLocationMarker className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors"
                >
                  {storeAddress}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <HiPhone className="w-4 h-4 text-gold-500 shrink-0" />
                {supportPhone}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <HiMail className="w-4 h-4 text-gold-500 shrink-0" />
                {supportEmail}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-600 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {year} {storeName} Mens Wear. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs">
            Designed with ♥ for premium fashion
          </p>
        </div>
      </div>
    </footer>
  );
}
