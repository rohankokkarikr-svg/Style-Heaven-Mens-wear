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
  login:          (data) => api.post('/auth/login', data),
  signup:         (data) => api.post('/auth/signup', data),
  me:             ()     => api.get('/auth/me'),
  getRewards:     ()     => api.get('/auth/rewards'),
  getLeaderboard: ()     => api.get('/auth/leaderboard'),
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
    timeout: 60000,
  }),
  uploadDirect: (fd) => api.post('/products/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  generateBarcode: (id) => api.post(`/products/${id}/barcode`),
};

// ─── Orders ──────────────────────────────────────
export const orderAPI = {
  create:             (data)     => api.post('/orders', data),
  getMyOrders:        ()         => api.get('/orders/my'),
  getAll:             (params)   => api.get('/orders', { params }),
  getById:            (id)       => api.get(`/orders/${id}`),
  updateStatus:       (id, data) => api.put(`/orders/${id}/status`, data),
  updateOrderDetails: (id, data) => api.put(`/orders/${id}/edit`, data),
  cancelOrder:        (id)       => api.put(`/orders/${id}/cancel`),
  pay:                (id, data) => api.put(`/orders/${id}/pay`, data),
  verifyPayment:      (id, data) => api.put(`/orders/${id}/verify-payment`, data),
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

// ─── Artisans ────────────────────────────────────
export const artisanAPI = {
  getAll:       ()       => api.get('/artisans'),
  getById:      (id)     => api.get(`/artisans/${id}`),
  getMyProfile: ()       => api.get('/artisans/me'),
  getMyStats:   ()       => api.get('/artisans/me/stats'),
  updateProfile:(data)   => api.put('/artisans/me', data),
  verify:       (id, d)  => api.patch(`/artisans/${id}/verify`, d),
  getAllAdmin:   ()       => api.get('/artisans/admin/all'),
};

// ─── AI ──────────────────────────────────────────
export const aiAPI = {
  analyzeProduct:       (data) => api.post('/ai/analyze-product',       data, { timeout: 60000 }),
  generateDescription:  (data) => api.post('/ai/generate-description',   data, { timeout: 60000 }),
  generateFullCatalog:  (data) => api.post('/ai/full-catalog',           data, { timeout: 60000 }),
  detectCategory:       (data) => api.post('/ai/detect-category',        data, { timeout: 60000 }),
  translateProduct:     (data) => api.post('/ai/translate',              data, { timeout: 60000 }),
  suggestPrice:         (data) => api.post('/ai/suggest-price',          data, { timeout: 60000 }),
  generateArtisanStory: (data) => api.post('/ai/artisan-story',          data, { timeout: 60000 }),
  getInsights:          (data) => api.post('/ai/insights',               data, { timeout: 60000 }),
  smartSearch:          (data) => api.post('/ai/smart-search',           data, { timeout: 60000 }),
};

// ─── Admin Control Center ────────────────────────
export const adminAPI = {
  getOverview:          ()         => api.get('/admin/overview'),
  getArtisans:          (params)   => api.get('/admin/artisans', { params }),
  updateArtisanStatus:  (id, data) => api.put(`/admin/artisans/${id}/status`, data),
  getCustomers:         (params)   => api.get('/admin/customers', { params }),
  updateCustomerStatus: (id, data) => api.put(`/admin/customers/${id}/status`, data),
  getProducts:          (params)   => api.get('/admin/products', { params }),
  approveProduct:       (id)       => api.put(`/admin/products/${id}/approve`),
  rejectProduct:        (id, data) => api.put(`/admin/products/${id}/reject`, data),
  hideProduct:          (id, data) => api.put(`/admin/products/${id}/hide`, data),
  deleteProduct:        (id)       => api.delete(`/admin/products/${id}`),
  getCategories:        ()         => api.get('/admin/categories'),
  createCategory:       (data)     => api.post('/admin/categories', data),
  updateCategory:       (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory:       (id)       => api.delete(`/admin/categories/${id}`),
  getOrders:            (params)   => api.get('/admin/orders', { params }),
  updateOrderStatus:    (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getPayments:          ()         => api.get('/admin/payments'),
  getAIContent:         ()         => api.get('/admin/ai/content'),
  getAIStats:           ()         => api.get('/admin/ai/stats'),
  getReviews:           (params)   => api.get('/admin/reviews', { params }),
  approveReview:        (id, data) => api.put(`/admin/reviews/${id}/approve`, data),
  deleteReview:         (id)       => api.delete(`/admin/reviews/${id}`),
  getReports:           ()         => api.get('/admin/reports'),
  updateReportStatus:   (id, data) => api.put(`/admin/reports/${id}/status`, data),
  getAnalytics:         ()         => api.get('/admin/analytics'),
  getNotifications:     ()         => api.get('/admin/notifications'),
  sendNotification:     (data)     => api.post('/admin/notifications', data),
  getContent:           ()         => api.get('/admin/content'),
  getActivityLogs:      ()         => api.get('/admin/activity'),
  getSettings:          ()         => api.get('/admin/settings'),
  updateSettings:       (data)     => api.put('/admin/settings', data),
};

export default api;

