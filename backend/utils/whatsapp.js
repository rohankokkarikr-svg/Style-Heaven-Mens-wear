const twilio = require('twilio');

/**
 * Sends a WhatsApp notification to the admin with full order details.
 * Uses Twilio WhatsApp API.
 * 
 * Required .env configuration:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (e.g. +14155238886)
 */
exports.sendOrderWhatsappNotification = async (adminPhone, order, customerName) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  // 1. Format the items list
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  // Calculate pricing components
  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  const subtotal = (order.items || []).reduce((s, i) => s + (i.price_at_time * i.quantity), 0);
  const discount = order.discount_amount || 0;
  const shipping = order.total_price - subtotal + discount;

  // 2. Build the message body
  const messageBody = `🔔 *New Order Placed on Style Heaven!*
----------------------------------------
📦 *Order ID:* #${order.id?.substring(0, 8)}
👤 *Customer Name:* ${customerName}
📞 *Phone Number:* +91 ${order.phone}
📍 *Shipping Address:* ${order.shipping_address}

🛒 *Items Ordered (${itemsCount} items):*
${itemsText || 'No items listed'}

💰 *Payment Method:* ${String(order.payment_method || 'COD').toUpperCase()}
💵 *Subtotal:* ₹${subtotal.toLocaleString()}
🚚 *Shipping Fee:* ₹${Math.max(0, shipping).toLocaleString()}
🏷️ *Discount:* -₹${discount.toLocaleString()} ${order.coupon_code ? `(${order.coupon_code})` : ''}
========================================
💵 *Total Amount to Pay:* ₹${order.total_price?.toLocaleString()}
----------------------------------------`;

  console.log('\n--- [WHATSAPP OUTGOING MESSAGE] ---');
  console.log(messageBody);
  console.log('------------------------------------\n');

  if (!sid || !token || !fromNumber) {
    console.warn('⚠️ Twilio credentials missing in .env. Outgoing WhatsApp notification logged above.');
    return { success: false, reason: 'Credentials missing' };
  }

  try {
    // Format recipient phone number for Twilio (needs + and country code, e.g. +917676558335)
    let cleanPhone = adminPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        cleanPhone = '+' + cleanPhone;
      } else if (cleanPhone.length === 10) {
        cleanPhone = '+91' + cleanPhone;
      } else {
        cleanPhone = '+' + cleanPhone;
      }
    }

    // Format Twilio "from" number
    let cleanFrom = fromNumber.replace(/\D/g, '');
    if (!cleanFrom.startsWith('+')) {
      cleanFrom = '+' + cleanFrom;
    }

    const client = twilio(sid, token);
    const result = await client.messages.create({
      from: `whatsapp:${cleanFrom}`,
      to: `whatsapp:${cleanPhone}`,
      body: messageBody
    });

    console.log(`✅ WhatsApp notification sent successfully! Message SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('❌ Failed to send WhatsApp notification via Twilio:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Sends a WhatsApp notification to the admin when an order is cancelled.
 */
exports.sendOrderCancelWhatsappNotification = async (adminPhone, order, customerName) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  // Format the items list
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  // Build the message body
  const messageBody = `🚨 *Order Cancelled on Style Heaven!*
----------------------------------------
📦 *Order ID:* #${order.id?.substring(0, 8)}
👤 *Customer Name:* ${customerName}
📞 *Phone Number:* +91 ${order.phone}
💰 *Total Cancelled Amount:* ₹${order.total_price?.toLocaleString()}
🛒 *Items in Cancelled Order (${itemsCount} items):*
${itemsText || 'No items listed'}
----------------------------------------`;

  console.log('\n--- [WHATSAPP OUTGOING CANCELLATION MESSAGE] ---');
  console.log(messageBody);
  console.log('------------------------------------\n');

  if (!sid || !token || !fromNumber) {
    console.warn('⚠️ Twilio credentials missing in .env. Outgoing cancellation WhatsApp notification logged above.');
    return { success: false, reason: 'Credentials missing' };
  }

  try {
    let cleanPhone = adminPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        cleanPhone = '+' + cleanPhone;
      } else if (cleanPhone.length === 10) {
        cleanPhone = '+91' + cleanPhone;
      } else {
        cleanPhone = '+' + cleanPhone;
      }
    }

    let cleanFrom = fromNumber.replace(/\D/g, '');
    if (!cleanFrom.startsWith('+')) {
      cleanFrom = '+' + cleanFrom;
    }

    const client = twilio(sid, token);
    const result = await client.messages.create({
      from: `whatsapp:${cleanFrom}`,
      to: `whatsapp:${cleanPhone}`,
      body: messageBody
    });

    console.log(`✅ WhatsApp cancellation notification sent successfully! Message SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('❌ Failed to send WhatsApp cancellation notification via Twilio:', err.message);
    return { success: false, error: err.message };
  }
};
