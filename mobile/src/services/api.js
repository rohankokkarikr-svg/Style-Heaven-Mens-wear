/**
 * Style Heaven Mens — Mobile API Client
 * Axios HTTP client with interceptors, token handling, and offline fallbacks
 */

import axios from 'axios';
import { API_BASE_URL, API_FALLBACK_URL, PRODUCTION_API_URL } from '../constants/config';
import storage from './storage';
import { HANDICRAFT_PRODUCTS } from '../constants/handicraftsData';

// Determine initial baseURL
const baseURL = PRODUCTION_API_URL || API_BASE_URL;

const api = axios.create({
  baseURL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-client-platform': 'mobile-react-native',
  },
});

// Request Interceptor: Attach Bearer JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading auth token in API interceptor', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Session expiration
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeToken();
      await storage.removeUser();
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
  getRewards: () => api.get('/auth/rewards'),
  getLeaderboard: () => api.get('/auth/leaderboard'),
};

// ─── Products API ────────────────────────────────────────────
export const productAPI = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/products', { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
      return { data: HANDICRAFT_PRODUCTS };
    } catch (err) {
      console.warn('Backend product fetch error, returning local catalog:', err.message);
      return { data: HANDICRAFT_PRODUCTS };
    }
  },

  getFeatured: async () => {
    try {
      const res = await api.get('/products/featured');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
      return { data: HANDICRAFT_PRODUCTS.slice(0, 8) };
    } catch (err) {
      return { data: HANDICRAFT_PRODUCTS.slice(0, 8) };
    }
  },

  getById: async (id) => {
    try {
      const res = await api.get(`/products/${id}`);
      if (res.data) return res;
      const local = HANDICRAFT_PRODUCTS.find((p) => String(p.id) === String(id));
      if (local) return { data: local };
      return { data: null };
    } catch (err) {
      const local = HANDICRAFT_PRODUCTS.find((p) => String(p.id) === String(id));
      if (local) return { data: local };
      throw err;
    }
  },
};

// ─── Orders API ──────────────────────────────────────────────
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  updateOrderDetails: (id, data) => api.put(`/orders/${id}/edit`, data),
  pay: (id, data) => api.put(`/orders/${id}/pay`, data),
};

// ─── Coupons API ─────────────────────────────────────────────
export const couponAPI = {
  spin: () => api.post('/coupons/spin'),
  validate: (code) => api.post('/coupons/validate', { code }),
  getMyCoupons: () => api.get('/coupons/my-coupons'),
};

// ─── Settings API ────────────────────────────────────────────
export const settingsAPI = {
  get: () => api.get('/settings'),
};

// ─── Artisans API ────────────────────────────────────────────
export const artisanAPI = {
  getAll: () => api.get('/artisans'),
  getById: (id) => api.get(`/artisans/${id}`),
};

// ─── Reviews API ─────────────────────────────────────────────
export const reviewAPI = {
  getApproved: () => api.get('/reviews'),
  submit: (data) => api.post('/reviews', data),
};

export default api;
