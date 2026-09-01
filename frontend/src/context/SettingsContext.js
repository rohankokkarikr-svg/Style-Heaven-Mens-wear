import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../services/api';
import { supabase } from '../lib/supabase';

const SETTINGS_CACHE_KEY = 'sh_settings_v4_synced';

// Clean up old legacy keys that cause stale data on mobile devices
try {
  localStorage.removeItem('heroSlides');
  localStorage.removeItem('discountBanner');
  localStorage.removeItem('sh_settings');
  localStorage.removeItem('sh_settings_v2');
  localStorage.removeItem('sh_settings_v3');
} catch {}

export const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336522/style-heaven-assets/hero_slide_1.png',
    badgeText: '',
    badgeType: 'new',
    headline: 'Redefine Your Style',
    subtitle: 'Premium menswear collection crafted for modern gentlemen.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336524/style-heaven-assets/hero_slide_2.png',
    badgeText: '✦ New Arrival',
    badgeType: 'new',
    headline: 'Summer Collection 2026',
    subtitle: 'Fresh arrivals with trending fashion styles.',
    buttonText: 'Explore Collection',
    buttonLink: '/products',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336525/style-heaven-assets/hero_slide_3.png',
    badgeText: '',
    badgeType: 'new',
    headline: 'Classic Meets Modern',
    subtitle: 'Elegant outfits for every occasion.',
    buttonText: 'View Products',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336527/style-heaven-assets/hero_slide_4.png',
    badgeText: '★ Limited Edition',
    badgeType: 'sale',
    headline: 'Luxury You Can Wear',
    subtitle: 'Discover exclusive fashion with premium quality.',
    buttonText: 'Discover More',
    buttonLink: '/products',
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
    // Seed from versioned localStorage for instant paint without stale data
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
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
    let loadedData = null;

    // 1. Try Backend API first
    try {
      const { data } = await settingsAPI.get();
      if (data && typeof data === 'object') {
        loadedData = data;
      }
    } catch (err) {
      // Backend not reachable from mobile client or static hosting — proceed to Supabase fallback
    }

    // 2. Fallback to Supabase platform_settings / custom settings
    if (!loadedData || !loadedData.heroSlides) {
      try {
        const { data: supaData } = await supabase
          .from('platform_settings')
          .select('*')
          .eq('id', 'main')
          .single();

        if (supaData) {
          loadedData = {
            ...DEFAULT_SETTINGS,
            ...loadedData,
            ...supaData,
            heroSlides: Array.isArray(supaData.hero_slides) && supaData.hero_slides.length > 0
              ? supaData.hero_slides
              : (Array.isArray(supaData.heroSlides) && supaData.heroSlides.length > 0 ? supaData.heroSlides : (loadedData?.heroSlides || DEFAULT_HERO_SLIDES)),
            discountBanner: supaData.discount_banner || supaData.discountBanner || loadedData?.discountBanner || DEFAULT_DISCOUNT_BANNER,
          };
        }
      } catch (e) {
        // Silently use defaults if offline
      }
    }

    const merged = {
      ...DEFAULT_SETTINGS,
      ...(loadedData || {}),
      heroSlides: Array.isArray(loadedData?.heroSlides) && loadedData.heroSlides.length > 0
        ? loadedData.heroSlides
        : DEFAULT_HERO_SLIDES,
      discountBanner: loadedData?.discountBanner
        ? { ...DEFAULT_DISCOUNT_BANNER, ...loadedData.discountBanner }
        : DEFAULT_DISCOUNT_BANNER,
    };

    setSettings(merged);
    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
    } catch {}
  }, []);

  const updateSettings = useCallback(async (partialUpdates) => {
    try {
      const updated = {
        ...settings,
        ...partialUpdates,
      };

      // 1. Optimistic local update
      setSettings(updated);
      try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(updated));
      } catch {}

      // 2. Persist to backend server API
      try {
        await settingsAPI.update(partialUpdates);
      } catch (apiErr) {
        console.warn('Backend API update failed, syncing with Supabase directly:', apiErr.message);
      }

      // 3. Persist to Supabase platform_settings for direct mobile & global reach
      try {
        const supaPayload = {
          id: 'main',
          ...partialUpdates,
          hero_slides: partialUpdates.heroSlides || updated.heroSlides,
          discount_banner: partialUpdates.discountBanner || updated.discountBanner,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('platform_settings').upsert([supaPayload]);
      } catch (supaErr) {
        console.warn('Supabase platform_settings update warning:', supaErr.message);
      }

      return { success: true };
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  }, [settings]);

  // Load fresh settings on mount
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
