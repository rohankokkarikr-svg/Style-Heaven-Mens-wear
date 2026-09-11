/**
 * backend/routes/payments.js
 * ─────────────────────────────────────────────────────────────────
 * Payment routes — Razorpay webhook (must use raw body for signature verification)
 * This route is registered BEFORE express.json() in server.js
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { broadcastSync } = require('../utils/realtime');
const { checkAndGrantReward } = require('../services/rewardService');
const { syncMasterOrderStatus } = require('../services/orderService');

/**
 * POST /api/payments/webhook
 * Razorpay sends payment events here.
 * MUST be idempotent — the same event may arrive multiple times.
 * Uses raw body (registered before express.json middleware).
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // 1. Verify webhook signature
  if (webhookSecret && signature) {
    try {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

      if (expectedSig !== signature) {
        console.warn('[webhook] Invalid Razorpay signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } catch (err) {
      console.error('[webhook] Signature verification error:', err.message);
      return res.status(400).json({ error: 'Signature verification failed' });
    }
  } else {
    console.warn('[webhook] No webhook secret configured or no signature header — skipping verification');
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.log(`[webhook] Event received: ${event.event}`);

  // 2. Handle payment.captured (successful payment)
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (!payment) return res.status(200).json({ received: true });

    const { order_id: razorpayOrderId, id: razorpayPaymentId, amount, notes } = payment;

    try {
      // Idempotency: check if already processed
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('provider_order_id', razorpayOrderId)
        .maybeSingle();

      if (existingPayment && existingPayment.status === 'paid') {
        console.log(`[webhook] Payment ${razorpayOrderId} already processed — skipping`);
        return res.status(200).json({ received: true, skipped: true });
      }

      // Find the order by razorpay_order_id
      const { data: order } = await supabase
        .from('orders')
        .select('id, user_id, order_status')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (!order) {
        console.warn(`[webhook] Order not found for razorpay_order_id: ${razorpayOrderId}`);
        return res.status(200).json({ received: true });
      }

      // Update payment record
      await supabase
        .from('payments')
        .update({
          provider_payment_id: razorpayPaymentId,
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.id);

      // Update master order
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
          order_status: 'confirmed',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Update all artisan_orders for this order to 'pending' (ready for artisan to accept)
      await supabase
        .from('artisan_orders')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('order_id', order.id);

      // Broadcast realtime update
      broadcastSync('PAYMENTS_UPDATED', {
        orderId: order.id,
        razorpayOrderId,
        razorpayPaymentId,
        status: 'paid',
      });
      broadcastSync('ORDERS_UPDATED', {
        orderId: order.id,
        order_status: 'confirmed',
        payment_status: 'paid',
      });

      console.log(`[webhook] ✅ Payment captured for order ${order.id}`);
    } catch (err) {
      console.error('[webhook] Error processing payment.captured:', err.message);
    }
  }

  // 3. Handle payment.failed
  if (event.event === 'payment.failed') {
    const payment = event.payload?.payment?.entity;
    if (!payment) return res.status(200).json({ received: true });
    const { order_id: razorpayOrderId, id: razorpayPaymentId } = payment;

    try {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (order) {
        await supabase.from('payments').update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          provider_payment_id: razorpayPaymentId,
          updated_at: new Date().toISOString(),
        }).eq('order_id', order.id);

        await supabase.from('orders').update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        }).eq('id', order.id);

        broadcastSync('PAYMENTS_UPDATED', { orderId: order.id, status: 'failed' });
        console.log(`[webhook] Payment failed for order ${order.id}`);
      }
    } catch (err) {
      console.error('[webhook] Error processing payment.failed:', err.message);
    }
  }

  // 4. Handle refund.created / refund.processed
  if (event.event === 'refund.created' || event.event === 'refund.processed') {
    const refund = event.payload?.refund?.entity;
    if (refund) {
      console.log(`[webhook] Refund event: ${refund.id} for payment ${refund.payment_id}`);
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('provider_payment_id', refund.payment_id)
          .maybeSingle();

        if (payment) {
          await supabase.from('payments').update({
            refund_id: refund.id,
            refund_amount: refund.amount / 100,
            refunded_at: new Date().toISOString(),
            status: 'refunded',
            updated_at: new Date().toISOString(),
          }).eq('order_id', payment.order_id);

          broadcastSync('PAYMENTS_UPDATED', { orderId: payment.order_id, status: 'refunded' });
        }
      } catch (err) {
        console.error('[webhook] refund processing error:', err.message);
      }
    }
  }

  res.status(200).json({ received: true });
});

/**
 * POST /api/payments/verify
 * Client-side payment verification after Razorpay checkout popup.
 * Called immediately after the frontend gets razorpay_payment_id from the popup.
 */
router.post('/verify', require('../middleware/auth').protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    // 1. Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('[verify] Signature mismatch for order:', orderId);
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // 2. Find order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, user_id, payment_status')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) return res.status(404).json({ error: 'Order not found' });

    // 3. Authorization check
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to verify this payment' });
    }

    // 4. Idempotency: already verified
    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Payment already verified', alreadyPaid: true });
    }

    // 5. Update order & payment records
    await supabase.from('orders').update({
      payment_status: 'paid',
      order_status: 'confirmed',
      status: 'confirmed',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    await supabase.from('payments').update({
      provider_order_id: razorpay_order_id,
      provider_payment_id: razorpay_payment_id,
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    // 6. Confirm artisan sub-orders
    await supabase.from('artisan_orders').update({
      status: 'pending',
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    // 7. Broadcast
    broadcastSync('PAYMENTS_UPDATED', { orderId, status: 'paid', razorpay_payment_id });
    broadcastSync('ORDERS_UPDATED', { orderId, order_status: 'confirmed' });

    console.log(`[verify] ✅ Payment verified for order ${orderId}`);
    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    console.error('[verify] Error:', err.message);
    res.status(500).json({ error: 'Payment verification failed: ' + err.message });
  }
});

module.exports = router;
