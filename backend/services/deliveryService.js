/**
 * backend/services/deliveryService.js
 * ─────────────────────────────────────────────────────────────────
 * Centralised delivery fee calculation.
 * Always use this service — never compute delivery fees inline.
 */

const { getEcomSettings, calculateDeliveryFee } = require('../config/ecommerce');

/**
 * Get current delivery settings.
 */
exports.getDeliverySettings = async () => {
  const settings = await getEcomSettings();
  return {
    deliveryFee: settings.delivery_fee,
    freeDeliveryAbove: settings.free_delivery_above,
  };
};

/**
 * Calculate delivery fee for a given subtotal.
 * @param {number} subtotal
 * @returns {Promise<number>} delivery fee in INR
 */
exports.calculateFee = async (subtotal) => {
  return calculateDeliveryFee(subtotal);
};
