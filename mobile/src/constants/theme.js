/**
 * Style Heaven Mens — Mobile Theme & Design Tokens
 * Luxury Dark & Gold aesthetic tailored for Indian artisanal menswear
 */

export const COLORS = {
  // Backgrounds
  background: '#0A0A0A',
  surface: '#121212',
  surfaceCard: '#1A1A1A',
  surfaceElevated: '#222222',
  surfaceHighlight: '#2A2A2A',

  // Gold Accents
  gold: '#D4AF37',
  goldLight: '#F3E5AB',
  goldDark: '#AA820A',
  goldMuted: 'rgba(212, 175, 55, 0.15)',
  goldBorder: 'rgba(212, 175, 55, 0.35)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  textDark: '#0A0A0A',
  textGold: '#E5C158',

  // Borders & Dividers
  border: '#262626',
  borderLight: '#333333',
  divider: '#1E1E1E',

  // Status & Feedback
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.15)',

  // Brand Accents
  phonePe: '#5F259F',
  whatsapp: '#25D366',
  gpay: '#4285F4',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  serif: 'serif',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
};
