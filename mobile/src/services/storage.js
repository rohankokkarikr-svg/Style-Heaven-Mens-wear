/**
 * Style Heaven Mens — Mobile Storage Service
 * Type-safe persistent storage using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@sh_token',
  USER: '@sh_user',
  CART: '@sh_cart',
  WISHLIST: '@sh_wishlist',
  SAVED_ADDRESSES: '@sh_saved_addresses',
  SEARCH_HISTORY: '@sh_search_history',
  SETTINGS: '@sh_settings',
  NOTIFICATIONS_TOKEN: '@sh_push_token',
  OFFLINE_PRODUCTS: '@sh_cached_products',
};

export const storage = {
  // Token
  async getToken() {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch (e) {
      console.warn('Failed to get token from storage', e);
      return null;
    }
  },

  async setToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(KEYS.TOKEN, token);
      } else {
        await AsyncStorage.removeItem(KEYS.TOKEN);
      }
    } catch (e) {
      console.warn('Failed to save token to storage', e);
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem(KEYS.TOKEN);
    } catch (e) {
      console.warn('Failed to remove token', e);
    }
  },

  // User
  async getUser() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Failed to get user from storage', e);
      return null;
    }
  },

  async setUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(KEYS.USER);
      }
    } catch (e) {
      console.warn('Failed to save user to storage', e);
    }
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
    } catch (e) {
      console.warn('Failed to remove user', e);
    }
  },

  // Cart
  async getCart() {
    try {
      const data = await AsyncStorage.getItem(KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to get cart', e);
      return [];
    }
  },

  async setCart(cart) {
    try {
      await AsyncStorage.setItem(KEYS.CART, JSON.stringify(cart || []));
    } catch (e) {
      console.warn('Failed to set cart', e);
    }
  },

  // Wishlist
  async getWishlist() {
    try {
      const data = await AsyncStorage.getItem(KEYS.WISHLIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to get wishlist', e);
      return [];
    }
  },

  async setWishlist(wishlist) {
    try {
      await AsyncStorage.setItem(KEYS.WISHLIST, JSON.stringify(wishlist || []));
    } catch (e) {
      console.warn('Failed to set wishlist', e);
    }
  },

  // Search History
  async getSearchHistory() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SEARCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addSearchHistory(query) {
    try {
      if (!query || !query.trim()) return;
      const history = await this.getSearchHistory();
      const trimmed = query.trim();
      const updated = [trimmed, ...history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
      await AsyncStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save search history', e);
    }
  },

  async clearSearchHistory() {
    try {
      await AsyncStorage.removeItem(KEYS.SEARCH_HISTORY);
    } catch (e) {}
  },

  // Generic key-value
  async get(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      return null;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },

  async clearAll() {
    try {
      await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.CART, KEYS.WISHLIST]);
    } catch (e) {}
  },
};

export default storage;
