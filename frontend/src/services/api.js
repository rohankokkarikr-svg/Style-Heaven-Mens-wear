import axios from 'axios';

// Base API instance pointing to backend
const api = axios.create({
  baseURL: (() => {
    const envUrl = process.env.REACT_APP_API_URL;
    if (!envUrl) return 'http://localhost:5000/api';
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  })(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sh_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Log detailed error info for debugging
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
    } else if (error.request) {
      console.error('🔴 API No Response:', error.request);
      // This happens on network errors or timeouts
    } else {
      console.error('🔴 API Setup Error:', error.message);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('sh_token');
      localStorage.removeItem('sh_user');
      // Only redirect if not already on login page to avoid loops
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


// ─── Auth ────────────────────────────────────────
export const authAPI = {
  login:   (data) => api.post('/auth/login', data),
  signup:  (data) => api.post('/auth/signup', data),
  me:      ()     => api.get('/auth/me'),
  getRewards: ()  => api.get('/auth/rewards'),
};


// ─── Products ────────────────────────────────────
export const productAPI = {
  getAll:      (params) => api.get('/products', { params }),
  getById:     (id)     => api.get(`/products/${id}`),
  getFeatured: ()       => api.get('/products/featured'),
  create:      (data)   => api.post('/products', data),
  update:      (id, d)  => api.put(`/products/${id}`, d),
  delete:      (id)     => api.delete(`/products/${id}`),
  uploadImage: (id, fd) => api.post(`/products/${id}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadDirect: (fd) => api.post('/products/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  generateBarcode: (id) => api.post(`/products/${id}/barcode`),
};

// ─── Orders ──────────────────────────────────────
export const orderAPI = {
  create:         (data)     => api.post('/orders', data),
  getMyOrders:    ()         => api.get('/orders/my'),
  getAll:         (params)   => api.get('/orders', { params }),
  getById:        (id)       => api.get(`/orders/${id}`),
  updateStatus:   (id, data) => api.put(`/orders/${id}/status`, data),
  cancelOrder:    (id)       => api.put(`/orders/${id}/cancel`),
  pay:            (id, data) => api.put(`/orders/${id}/pay`, data),
};

// ─── Sales / Barcode ─────────────────────────────
export const salesAPI = {
  recordScan:  (data)   => api.post('/sales/scan', data),
  getDailySales: (date) => api.get('/sales/daily', { params: { date } }),
  getSummary:  ()       => api.get('/sales/summary'),
};

// ─── Dashboard ───────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ─── Reviews ─────────────────────────────────────
export const reviewAPI = {
  getApproved: () => api.get('/reviews'),
  getAll: () => api.get('/reviews/admin'),
  submit: (data) => api.post('/reviews', data),
  approve: (id) => api.patch(`/reviews/${id}/approve`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ─── Coupons ─────────────────────────────────────
export const couponAPI = {
  spin:     ()     => api.post('/coupons/spin'),
  validate: (code) => api.post('/coupons/validate', { code }),
  getMy:    ()     => api.get('/coupons/my-coupons'),
};

// ─── Settings ─────────────────────────────────────
export const settingsAPI = {
  get:    ()       => api.get('/settings'),
  update: (data)   => api.put('/settings', data),
};

export default api;
