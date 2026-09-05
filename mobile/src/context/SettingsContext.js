/**
 * Style Heaven Mens — Mobile Settings Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop',
    headline: 'Royal Handloom Menswear',
    subtitle: 'Pure Banarasi silk kurtas, handcrafted stoles, and festive ethnic wear.',
    badgeText: '★ Authentic Craft',
    badgeType: 'new',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop',
    headline: 'Summer Festive Collection',
    subtitle: 'Hand-block printed cotton shirts and linen jackets made by master artisans.',
    badgeText: '✦ New Arrivals',
    badgeType: 'new',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop',
    headline: 'Handcrafted Luxury Details',
    subtitle: 'Brass cufflinks, embroidered waistcoats, and regal traditional accessories.',
    badgeText: '★ Limited Edition',
    badgeType: 'sale',
  },
];

export const DEFAULT_DISCOUNT_BANNER = {
  title: 'Artisan Launch Sale',
  description: 'Get flat 30% OFF on all handcrafted menswear',
  code: 'KALA30',
  discountPercentage: 30,
  isActive: true,
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    storeName: 'Style Heaven Mens',
    heroSlides: DEFAULT_HERO_SLIDES,
    discountBanner: DEFAULT_DISCOUNT_BANNER,
    whatsappNumber: '917676558335',
    currency: '₹',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await settingsAPI.get();
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
            heroSlides: Array.isArray(data.heroSlides) && data.heroSlides.length > 0 ? data.heroSlides : DEFAULT_HERO_SLIDES,
            discountBanner: data.discountBanner || DEFAULT_DISCOUNT_BANNER,
          }));
        }
      } catch (e) {
        console.warn('Using default settings in mobile app');
      }
    };
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
};

export default SettingsContext;
