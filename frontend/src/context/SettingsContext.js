import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../services/api';

const DEFAULT_SETTINGS = {
  storeName: 'Style Heaven',
  supportEmail: 'support@styleheaven.com',
  supportPhone: '+91 7676558335',
  storeAddress: "Style heaven men's Wear, L. E, T College Road, near Wali Complex, Gokak, Karnataka 591307",
  currency: 'INR (₹)',
  taxRate: '18',
  maintenanceMode: false,
  orderNotifications: true,
  instagramUrl: 'https://www.instagram.com/style_heaven_mens_wear?igsh=MXVueXV5ejc1bXVvNQ==',
  whatsappNumber: '917676558335',
  footerTagline: "Redefining men's fashion with premium quality fabrics, timeless designs, and unmatched elegance.",
};

const SettingsContext = createContext({ settings: DEFAULT_SETTINGS, refreshSettings: () => {} });

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Seed from localStorage for instant paint (avoid flash)
    try {
      const cached = localStorage.getItem('sh_settings');
      if (cached) return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const refreshSettings = useCallback(async () => {
    try {
      const { data } = await settingsAPI.get();
      const merged = { ...DEFAULT_SETTINGS, ...data };
      setSettings(merged);
      localStorage.setItem('sh_settings', JSON.stringify(merged));
    } catch (err) {
      // Silently fall back to defaults / cached — no toast spam for visitors
      console.warn('Could not load site settings:', err.message);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
