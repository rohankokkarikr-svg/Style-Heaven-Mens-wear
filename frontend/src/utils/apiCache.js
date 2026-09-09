/**
 * In-Memory Stale-While-Revalidate (SWR) API Cache
 * Makes page navigation & re-visits 0ms instantaneous
 */

class APICache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 3 * 60 * 1000; // 3 minutes fresh
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    return {
      data: entry.data,
      isExpired,
    };
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateProducts() {
    this.invalidate('/products');
  }

  invalidateCategories() {
    this.invalidate('/products/categories');
    this.invalidate('/admin/categories');
  }

  invalidateOrders() {
    this.invalidate('/orders');
  }

  invalidateSettings() {
    this.invalidate('/settings');
  }
}

export const apiCache = new APICache();
export default apiCache;
