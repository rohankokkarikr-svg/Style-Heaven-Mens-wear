const twilio = require('twilio');

// Helper to extract effective payment method
const getEffectivePaymentMethod = (order) => {
  let pm = order.payment_method || '';
  if (!pm && order.shipping_address) {
    const match = order.shipping_address.match(/\[Method:\s*([^\]]+)\]/i);
    if (match) pm = match[1];
  }
  if (!pm) return 'COD (Cash on Delivery)';
  const pmLower = pm.toLowerCase();
  if (pmLower.includes('upi') || pmLower.includes('phonepe') || pmLower.includes('online')) {
    return 'UPI / PhonePe QR';
  }
  if (pmLower.includes('cod')) {
    return 'COD (Cash on Delivery)';
  }
  return pm.toUpperCase();
};

// Helper to extract reference number from order
const extractRefNo = (order) => {
  if (order.transaction_id && !order.transaction_id.startsWith('TXN_') && !order.transaction_id.startsWith('REF_')) {
    return order.transaction_id;
  }
  if (order.shipping_address) {
    const match = order.shipping_address.match(/Ref\.?\s*No\.?:\s*([A-Za-z0-9_]+)/i);
    if (match) return match[1];
  }
  return order.transaction_id || 'N/A';
};

// Helper to format phone to E.164 standard
const formatPhone = (phoneStr) => {
  if (!phoneStr) return null;
  let digits = String(phoneStr).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  return '+' + digits;
};

// Initialize Twilio client supporting both Auth Token and API Key configurations
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_SECRET;
  const apiKeySid = process.env.TWILIO_API_KEY_SID || (accountSid?.startsWith('SK') ? accountSid : null);
  const mainAccountSid = process.env.TWILIO_MAIN_ACCOUNT_SID || (accountSid?.startsWith('AC') ? accountSid : null);

  if (!authToken || authToken.startsWith('your_')) {
    return null;
  }

  try {
    // Case 1: Using API Key (SK...) with Main Account SID (AC...)
    if (apiKeySid && apiKeySid.startsWith('SK') && mainAccountSid && mainAccountSid.startsWith('AC')) {
      return twilio(apiKeySid, authToken, { accountSid: mainAccountSid });
    }

    // Case 2: Standard Account SID (AC...) + Auth Token
    if (accountSid && accountSid.startsWith('AC')) {
      return twilio(accountSid, authToken);
    }

    return null;
  } catch (err) {
    console.error('❌ Twilio initialization error:', err.message);
    return null;
  }
};

/**
 * Send WhatsApp message to multiple recipients using Twilio API
 */
const sendWhatsappToRecipients = async (recipientPhones, messageBody) => {
  console.log('\n--- [WHATSAPP OUTGOING MESSAGE (Twilio)] ---');
  console.log(messageBody);
  console.log('--------------------------------------------\n');

  const client = getTwilioClient();
  const rawFrom = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '+14155238886';
  const fromNumber = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom.replace(/\s+/g, '')}`;

  if (!client) {
    console.warn('⚠️ Twilio credentials missing in .env! (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
    console.warn('👉 Please configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env');
    return { success: false, reason: 'Twilio credentials missing' };
  }

  const results = [];
  const uniquePhones = Array.from(new Set(recipientPhones.map(formatPhone).filter(Boolean)));

  for (const phone of uniquePhones) {
    const toFormatted = `whatsapp:${phone.replace(/\s+/g, '')}`;
    try {
      const message = await client.messages.create({
        from: fromNumber,
        to: toFormatted,
        body: messageBody
      });
      console.log(`✅ WhatsApp message sent via Twilio to ${toFormatted}! (SID: ${message.sid})`);
      results.push({ phone, to: toFormatted, success: true, sid: message.sid });
    } catch (err) {
      console.error(`❌ Twilio WhatsApp send failed for ${toFormatted}:`, err.message);
      results.push({ phone, to: toFormatted, success: false, error: err.message });
    }
  }

  return { success: results.some(r => r.success), results };
};

// Generate direct wa.me fallback link
const getWhatsappDirectLink = (phoneStr, text) => {
  const formatted = formatPhone(phoneStr);
  if (!formatted) return null;
  const cleanNumber = formatted.replace(/\+/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
};

// Formats the order confirmation message
const buildOrderWhatsappText = (order, customerName) => {
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  const subtotal = (order.items || []).reduce((s, i) => s + (i.price_at_time * i.quantity), 0);
  const discount = order.discount_amount || 0;
  const shipping = (order.total_price || 0) - subtotal + discount;
  const isUpi = getEffectivePaymentMethod(order).includes('UPI');

  return `🔔 *New Order Placed on KalaStyle AI!*
----------------------------------------
📦 *Order ID:* #${order.id?.substring(0, 8)}
👤 *Customer Name:* ${customerName}
📞 *Phone Number:* +91 ${order.phone}
📍 *Shipping Address:* ${order.shipping_address}

🛒 *Items Ordered (${itemsCount} items):*
${itemsText || 'No items listed'}

💰 *Payment Method:* ${getEffectivePaymentMethod(order)}
💵 *Subtotal:* ₹${subtotal.toLocaleString()}
🚚 *Shipping Fee:* ₹${Math.max(0, shipping).toLocaleString()}
🏷️ *Discount:* -₹${discount.toLocaleString()} ${order.coupon_code ? `(${order.coupon_code})` : ''}
========================================
💵 *Total Amount to Pay:* ₹${(order.total_price || 0).toLocaleString()}
----------------------------------------
${isUpi ? '⏳ *Payment Status:* Awaiting UPI Ref. No. Submission' : '✅ *Order Status:* CONFIRMED (COD)'}`;
};

exports.getEffectivePaymentMethod = getEffectivePaymentMethod;
exports.formatPhone = formatPhone;
exports.getWhatsappDirectLink = getWhatsappDirectLink;
exports.buildOrderWhatsappText = buildOrderWhatsappText;

/**
 * Sends a WhatsApp notification to Admin & Customer when a new order is placed (COD or UPI).
 */
exports.sendOrderWhatsappNotification = async (adminPhone, order, customerName) => {
  const messageBody = buildOrderWhatsappText(order, customerName);
  const twilioRes = await sendWhatsappToRecipients([adminPhone, order.phone], messageBody);
  const directLink = getWhatsappDirectLink(adminPhone, messageBody);

  return {
    ...twilioRes,
    messageText: messageBody,
    directLink
  };
};

/**
 * Sends a WhatsApp notification to Admin & Customer when UPI Ref. No. / UTR is submitted.
 */
exports.sendRefNoSubmittedWhatsappNotification = async (adminPhone, order, customerName) => {
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  const refNo = extractRefNo(order);

  const messageBody = `⏱️ *UPI Payment Ref. No. Submitted!*
----------------------------------------
📦 *Order ID:* #${order.id?.substring(0, 8)}
👤 *Customer Name:* ${customerName}
📞 *Phone Number:* +91 ${order.phone}
📍 *Shipping Address:* ${order.shipping_address || 'N/A'}
🔑 *Submitted Ref. No / UTR:* ${refNo}
💰 *Payment Method:* ${getEffectivePaymentMethod(order)}
💵 *Total Amount:* ₹${order.total_price?.toLocaleString()}

🛒 *Items in Order (${itemsCount} items):*
${itemsText || 'No items listed'}
========================================
⌛ *Status:* Pending Admin Payment Verification
----------------------------------------`;

  const twilioRes = await sendWhatsappToRecipients([adminPhone, order.phone], messageBody);
  const directLink = getWhatsappDirectLink(adminPhone, messageBody);

  return {
    ...twilioRes,
    messageText: messageBody,
    directLink
  };
};

/**
 * Sends a WhatsApp notification to Admin & Customer when an order payment is verified & approved.
 */
exports.sendPaymentVerifiedWhatsappNotification = async (adminPhone, order, customerName) => {
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  const refNo = extractRefNo(order);

  const messageBody = `✅ *Payment Verified & Approved!*
----------------------------------------
📦 *Order ID:* #${order.id?.substring(0, 8)}
👤 *Customer Name:* ${customerName}
📞 *Phone Number:* +91 ${order.phone}
🔑 *Verified Ref. No / UTR:* ${refNo}
💰 *Payment Method:* ${getEffectivePaymentMethod(order)}
💵 *Paid Amount:* ₹${order.total_price?.toLocaleString()}

🛒 *Items to Process (${itemsCount} items):*
${itemsText || 'No items listed'}
========================================
🎉 *Order Status:* PAYMENT VERIFIED & CONFIRMED
----------------------------------------`;

  return await sendWhatsappToRecipients([adminPhone, order.phone], messageBody);
};

/**
 * Sends a WhatsApp notification to Admin & Customer when an order is cancelled.
 */
exports.sendOrderCancelWhatsappNotification = async (adminPhone, order, customerName) => {
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  const messageBody = `🚨 *Order Cancelled on KalaStyle AI!*
----------------------------------------
📦 *Order ID:* #${order.id?.substring(0, 8)}
👤 *Customer Name:* ${customerName}
📞 *Phone Number:* +91 ${order.phone}
💰 *Total Amount:* ₹${order.total_price?.toLocaleString()}

🛒 *Items in Order (${itemsCount} items):*
${itemsText || 'No items listed'}
========================================
❌ *Order Status:* CANCELLED
----------------------------------------`;

  const res = await sendWhatsappToRecipients([adminPhone, order.phone], messageBody);
  const directLink = getWhatsappDirectLink(adminPhone, messageBody);

  return {
    ...res,
    messageText: messageBody,
    directLink
  };
};

/**
 * Sends a WhatsApp notification to Admin & Customer when an order is updated/edited.
 */
exports.sendOrderEditWhatsappNotification = async (adminPhone, order, customerName) => {
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  const messageBody = `✏️ *Order Details Updated!*
----------------------------------------
📦 *Order ID:* #${order.id?.substring(0, 8)}
👤 *Customer Name:* ${customerName}
📞 *Updated Phone Number:* +91 ${order.phone}
📍 *Updated Shipping Address:* ${order.shipping_address}
💰 *Payment Method:* ${getEffectivePaymentMethod(order)}

🛒 *Updated Items & Sizes (${itemsCount} items):*
${itemsText || 'No items listed'}
========================================
💵 *Total Amount:* ₹${order.total_price?.toLocaleString()}
----------------------------------------`;

  return await sendWhatsappToRecipients([adminPhone, order.phone], messageBody);
};
