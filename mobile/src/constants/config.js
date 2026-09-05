/**
 * Style Heaven Mens — Mobile App Configuration
 */

// Fallback host resolution for Android emulators (10.0.2.2) and local Wi-Fi / production Render backend
export const API_BASE_URL = 'http://10.0.2.2:5000/api';
export const API_FALLBACK_URL = 'http://localhost:5000/api';
export const PRODUCTION_API_URL = 'https://style-heaven-mens-wear.onrender.com/api';

// Public Supabase configuration for anonymous client queries
export const SUPABASE_URL = 'https://mock.supabase.co';
export const SUPABASE_ANON_KEY = 'mock-key';

export const APP_CONFIG = {
  appName: 'Style Heaven Mens',
  appTagline: "Redefining Men's Fashion with Premium Handcrafted Collections",
  supportPhone: '+91 7676558335',
  supportWhatsapp: '917676558335',
  adminUpiId: '7349083982@upi',
  currency: '₹',
  freeShippingThreshold: 1500,
  defaultDeliveryFee: 99,
  cancellationWindowHours: 12,
};

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};
