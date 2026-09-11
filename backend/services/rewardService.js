/**
 * backend/services/rewardService.js
 * ─────────────────────────────────────────────────────────────────
 * Handles reward eligibility and coupon granting.
 * Rewards are ONLY triggered on successfully DELIVERED eligible orders.
 * Duplicate reward granting is prevented by checking coupon existence.
 */

const supabase = require('../config/supabase');
const { getEcomSettings } = require('../config/ecommerce');

/**
 * Count how many eligible items (from delivered orders) this user has.
 * Eligible = any order_item from an order with order_status = 'delivered'
 * and the artisan_order is also 'delivered'.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countDeliveredEligibleItems(userId) {
  try {
    // Get all delivered orders for this user
    const { data: deliveredOrders } = await supabase
      .from('orders')
      .select('id, order_status, payment_status')
      .eq('user_id', userId)
      .in('order_status', ['delivered', 'partially_delivered', 'completed']);

    if (!deliveredOrders || deliveredOrders.length === 0) return 0;

    const orderIds = deliveredOrders.map(o => o.id);

    // Count items from artisan_orders that are delivered (more accurate than order-level)
    const { data: deliveredArtisanOrders } = await supabase
      .from('artisan_orders')
      .select('id, order_id')
      .in('order_id', orderIds)
      .eq('status', 'delivered');

    if (!deliveredArtisanOrders || deliveredArtisanOrders.length === 0) return 0;

    const deliveredAoIds = deliveredArtisanOrders.map(ao => ao.id);

    // Count order items linked to delivered artisan orders
    const { data: items } = await supabase
      .from('order_items')
      .select('id, quantity')
      .in('order_id', orderIds);

    // Sum quantities for items in orders that have at least one delivered artisan_order
    const deliveredOrderIds = new Set(deliveredArtisanOrders.map(ao => ao.order_id));
    let totalItems = 0;
    for (const item of (items || [])) {
      if (deliveredOrderIds.has(item.order_id)) {
        totalItems += (item.quantity || 1);
      }
    }

    return totalItems;
  } catch (err) {
    console.error('[rewardService] countDeliveredEligibleItems error:', err.message);
    return 0;
  }
}

/**
 * Check if user has already received a reward coupon at this delivery milestone.
 * Prevents duplicate reward granting.
 */
async function hasAlreadyGrantedRewardAt(userId, milestone) {
  const { data } = await supabase
    .from('coupons')
    .select('id')
    .eq('user_id', userId)
    .ilike('code', `REWARD${milestone}%`)
    .limit(1);
  return (data && data.length > 0);
}

/**
 * Check if a reward should be granted after a delivery, and grant it if so.
 * Call this after each artisan_order is marked 'delivered'.
 *
 * @param {string} userId
 * @returns {Promise<{granted: boolean, coupon?: object}>}
 */
exports.checkAndGrantReward = async (userId) => {
  try {
    const settings = await getEcomSettings();
    const threshold = settings.reward_eligible_count || 8;

    const deliveredCount = await countDeliveredEligibleItems(userId);

    // Calculate which milestone we're at
    const milestone = Math.floor(deliveredCount / threshold) * threshold;
    if (milestone === 0) return { granted: false };

    // Check if already granted for this milestone
    const alreadyGranted = await hasAlreadyGrantedRewardAt(userId, milestone);
    if (alreadyGranted) return { granted: false };

    // Grant a spin-wheel style coupon
    const code = `REWARD${milestone}${Date.now().toString(36).toUpperCase()}`;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30); // 30 days validity

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert([{
        code,
        discount_type: 'percentage',
        discount_value: 15, // 15% reward discount
        user_id: userId,
        expiry_date: expiry.toISOString(),
        is_used: false,
      }])
      .select()
      .single();

    if (error) {
      console.error('[rewardService] Failed to grant reward coupon:', error.message);
      return { granted: false };
    }

    console.log(`[rewardService] 🎁 Reward coupon ${code} granted to user ${userId} (milestone: ${milestone} items)`);
    return { granted: true, coupon };
  } catch (err) {
    console.error('[rewardService] checkAndGrantReward error:', err.message);
    return { granted: false };
  }
};

/**
 * Called on refund/return — check if reward should be reversed.
 * If user no longer has enough delivered items, expire the milestone coupon.
 * This is best-effort and does not fail the main operation.
 *
 * @param {string} userId
 */
exports.reverseRewardIfNeeded = async (userId) => {
  try {
    const settings = await getEcomSettings();
    const threshold = settings.reward_eligible_count || 8;
    const deliveredCount = await countDeliveredEligibleItems(userId);

    // Expire any milestone coupons that are no longer earned
    const earnedMilestone = Math.floor(deliveredCount / threshold) * threshold;

    // Find all reward coupons for this user that are above the earned milestone
    const { data: rewardCoupons } = await supabase
      .from('coupons')
      .select('id, code')
      .eq('user_id', userId)
      .eq('is_used', false)
      .ilike('code', 'REWARD%');

    for (const coupon of (rewardCoupons || [])) {
      const match = coupon.code.match(/^REWARD(\d+)/);
      if (match) {
        const couponMilestone = parseInt(match[1]);
        if (couponMilestone > earnedMilestone) {
          // Expire this coupon
          await supabase
            .from('coupons')
            .update({ expiry_date: new Date().toISOString() })
            .eq('id', coupon.id);
          console.log(`[rewardService] Reversed reward coupon ${coupon.code} for user ${userId}`);
        }
      }
    }
  } catch (err) {
    console.error('[rewardService] reverseRewardIfNeeded error:', err.message);
  }
};

exports.countDeliveredEligibleItems = countDeliveredEligibleItems;
