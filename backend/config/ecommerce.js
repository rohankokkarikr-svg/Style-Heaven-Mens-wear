/**
 * backend/config/ecommerce.js
 * ─────────────────────────────────────────────────────────────────
 * Centralised e-commerce configuration for KalaStyle AI.
 * All business rules (COD limits, delivery fee, cancellation window,
 * reward threshold) are sourced from the platform_settings table
 * and cached in-memory.  Never hard-code these values in controllers.
 */

const supabase = require('./supabase');

// ── Sensible in-code defaults (overridden by DB row) ──────────────
const DEFAULTS = {
  delivery_fee: 50,
  free_delivery_above: 500,
  cod_enabled: true,
  cod_max_order_value: 5000,
  cod_min_order_value: 100,
  cancellation_window_hours: 12,
  reward_eligible_count: 8,
  platform_commission: 10, // %
};

let _cached = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns e-commerce settings from DB (with in-memory cache).
 * Falls back to DEFAULTS if DB is unreachable.
 */
async function getEcomSettings() {
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL_MS) return _cached;

  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();

    if (data) {
      _cached = { ...DEFAULTS, ...data };
      _cachedAt = now;
      return _cached;
    }
  } catch (err) {
    console.warn('[ecommerce.js] Could not fetch platform_settings:', err.message);
  }

  _cached = { ...DEFAULTS };
  _cachedAt = now;
  return _cached;
}

/** Invalidate the in-memory cache (call after admin updates settings) */
function invalidateEcomCache() {
  _cached = null;
  _cachedAt = 0;
}

/**
 * Calculate delivery fee for a given subtotal.
 * Uses centralized business rule — never call this from the frontend.
 */
async function calculateDeliveryFee(subtotal) {
  const settings = await getEcomSettings();
  if (subtotal >= settings.free_delivery_above) return 0;
  return settings.delivery_fee;
}

/**
 * Derive master order status from the list of artisan order statuses.
 * This is the authoritative status-machine logic.
 */
function deriveMasterStatus(artisanStatuses) {
  if (!artisanStatuses || artisanStatuses.length === 0) return 'pending';

  const s = artisanStatuses.map(x => x.toLowerCase());
  const all = (val) => s.every(x => x === val);
  const some = (val) => s.some(x => x === val);
  const allIn = (...vals) => s.every(x => vals.includes(x));

  if (all('pending'))                             return 'pending';
  if (all('cancelled') || all('rejected'))        return 'cancelled';
  if (all('delivered'))                           return 'delivered';
  if (allIn('delivered', 'cancelled', 'rejected'))return 'partially_delivered';
  if (some('out_for_delivery'))                   return 'processing';
  if (some('dispatched'))                         return 'processing';
  if (some('delivered') && some('preparing'))     return 'partially_processing';
  if (some('delivered'))                          return 'partially_delivered';
  if (some('preparing') || some('ready_for_pickup') || some('accepted')) return 'processing';
  if (allIn('confirmed', 'pending'))              return 'confirmed';
  return 'processing';
}

/**
 * Allowed artisan order status transitions.
 * Artisans can only move forward — never skip steps or go backward.
 */
const ARTISAN_STATUS_TRANSITIONS = {
  pending:           ['accepted', 'rejected'],
  accepted:          ['preparing'],
  preparing:         ['ready_for_pickup'],
  ready_for_pickup:  ['dispatched'],
  dispatched:        ['out_for_delivery'],
  out_for_delivery:  ['delivered'],
  delivered:         [],   // terminal
  rejected:          [],   // terminal
  cancelled:         [],   // terminal
};

function isValidArtisanTransition(from, to) {
  const allowed = ARTISAN_STATUS_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

module.exports = {
  getEcomSettings,
  invalidateEcomCache,
  calculateDeliveryFee,
  deriveMasterStatus,
  isValidArtisanTransition,
  DEFAULTS,
};
