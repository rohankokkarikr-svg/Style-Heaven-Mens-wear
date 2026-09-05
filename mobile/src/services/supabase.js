/**
 * Style Heaven Mens — Optimized Supabase Mobile Client
 * Configured with AsyncStorage for session persistence, minimal egress, and ZERO background Realtime channels.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'style-heaven-mobile-app',
    },
  },
  // Realtime is explicitly disabled for mobile app to prevent battery drain and excessive concurrent connection quota
  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },
});

export default supabase;
