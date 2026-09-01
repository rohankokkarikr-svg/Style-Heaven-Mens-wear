import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../services/api';

export const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&auto=format&fit=crop',
    badgeText: '✦ Heritage Handlooms & Textiles',
    badgeType: 'new',
    headline: 'Authentic Indian Handicrafts',
    subtitle: 'Pure Banarasi silks, Kashmiri pashmina, and generational weaves directly from master artisans.',
    buttonText: 'Explore Handlooms',
    buttonLink: '/products?category=Handloom+%26+Textiles',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&auto=format&fit=crop',
    badgeText: '★ Artisanal Living',
    badgeType: 'sale',
    headline: 'Home Décor & Furnishings',
    subtitle: 'Handcrafted wall tapestries, brass lamps, dhurrie rugs, and royal teak carvings.',
    buttonText: 'Shop Home Décor',
    buttonLink: '/products?category=Home+D%C3%A9cor+%26+Furnishings',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&auto=format&fit=crop',
    badgeText: '✦ Dokra & Silver Filigree',
    badgeType: 'new',
    headline: 'Handmade Jewelry & Accessories',
    subtitle: '4000-year-old lost wax brass, 925 sterling jhumkas, and royal Kundan chokers.',
    buttonText: 'Shop Jewelry',
    buttonLink: '/products?category=Handmade+Jewelry+%26+Accessories',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=1600&auto=format&fit=crop',
    badgeText: '🌿 100% Sustainable & Biodegradable',
    badgeType: 'new',
    headline: 'Eco-Friendly & Natural Products',
    subtitle: 'Golden jute rugs, seasoned Assam bamboo homeware, and zero-plastic living.',
    buttonText: 'Shop Eco-Friendly',
    buttonLink: '/products?category=Eco-Friendly+%26+Natural+Products',
    align: 'center',
  },
];

export const DEFAULT_DISCOUNT_BANNER = {
  title: 'Artisan Launch Sale',
  description: 'Use this code and get upto 30% off on handmade products',
  discount: '30%',
  code: 'KALA30',
  discountPercentage: 30,
  buttonText: 'Grab the Deal',
  buttonLink: '/products',
  isActive: true,
};

const DEFAULT_SETTINGS = {
  storeName: 'KalaStyle AI',
  supportEmail: 'support@kalastyle.ai',
  supportPhone: '+91 7676558335',
  storeAddress: 'KalaStyle AI, Supporting Artisans & Handloom Crafts Across India',
  currency: 'INR (₹)',
  taxRate: '18',
  maintenanceMode: false,
  orderNotifications: true,
  instagramUrl: 'https://www.instagram.com/style_heaven_mens_wear?igsh=MXVueXV5ejc1bXVvNQ==',
  whatsappNumber: '917676558335',
  footerTagline: "Redefining men's fashion with premium quality fabrics, timeless designs, and unmatched elegance.",
  heroSlides: DEFAULT_HERO_SLIDES,
  discountBanner: DEFAULT_DISCOUNT_BANNER,
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  refreshSettings: () => {},
  updateSettings: async () => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Seed from localStorage for instant paint (avoid flash)
    try {
      const cached = localStorage.getItem('sh_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          heroSlides: Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0 ? parsed.heroSlides : DEFAULT_HERO_SLIDES,
          discountBanner: parsed.discountBanner ? { ...DEFAULT_DISCOUNT_BANNER, ...parsed.discountBanner } : DEFAULT_DISCOUNT_BANNER,
        };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const refreshSettings = useCallback(async () => {
    try {
      const { data } = await settingsAPI.get();
      const merged = {
        ...DEFAULT_SETTINGS,
        ...data,
        heroSlides: Array.isArray(data.heroSlides) && data.heroSlides.length > 0 ? data.heroSlides : (settings.heroSlides || DEFAULT_HERO_SLIDES),
        discountBanner: data.discountBanner ? { ...DEFAULT_DISCOUNT_BANNER, ...data.discountBanner } : (settings.discountBanner || DEFAULT_DISCOUNT_BANNER),
      };
      setSettings(merged);
      localStorage.setItem('sh_settings', JSON.stringify(merged));
    } catch (err) {
      console.warn('Could not load site settings:', err.message);
    }
  }, [settings.heroSlides, settings.discountBanner]);

  const updateSettings = useCallback(async (partialUpdates) => {
    try {
      const updated = {
        ...settings,
        ...partialUpdates,
      };
      // Optimistic update
      setSettings(updated);
      localStorage.setItem('sh_settings', JSON.stringify(updated));

      // Persist to backend server API
      const res = await settingsAPI.update(partialUpdates);
      if (res.data?.settings) {
        const serverMerged = {
          ...DEFAULT_SETTINGS,
          ...res.data.settings,
        };
        setSettings(serverMerged);
        localStorage.setItem('sh_settings', JSON.stringify(serverMerged));
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  }, [settings]);

  // Load on mount
  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
