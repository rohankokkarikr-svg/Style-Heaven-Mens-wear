const axios = require('axios');

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

const formatPhone = (phoneStr) => {
  if (!phoneStr) return null;
  let digits = String(phoneStr).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  return '+' + digits;
};

const sendWhatsappToRecipients = async (recipientPhones, messageBody) => {
  const apiKey = process.env.CALLMEBOT_API_KEY;

  console.log('\n--- [WHATSAPP OUTGOING MESSAGE (CallMeBot)] ---');
  console.log(messageBody);
  console.log('------------------------------------------------\n');

  if (!apiKey || apiKey === 'your_callmebot_api_key' || apiKey.trim() === '') {
    console.warn('⚠️ CALLMEBOT_API_KEY missing in .env!');
    console.warn("👉 To get your free CallMeBot API key, send 'I allow callmebot to send me messages' to +34 623 78 64 49 on WhatsApp.");
    return { success: false, reason: 'CallMeBot API key missing' };
  }

  const results = [];
  const uniquePhones = Array.from(new Set(recipientPhones.map(formatPhone).filter(Boolean)));

  for (const phone of uniquePhones) {
    const cleanPhone = phone.replace(/\s+/g, '');
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(messageBody)}&apikey=${encodeURIComponent(apiKey.trim())}`;
      const response = await axios.get(url, { timeout: 10000 });
      
      if (typeof response.data === 'string' && response.data.includes('APIKey is invalid')) {
        console.error(`❌ CallMeBot API key invalid for ${phone}`);
        results.push({ phone, success: false, error: 'Invalid APIKey' });
      } else {
        console.log(`✅ WhatsApp message sent via CallMeBot to ${phone}!`);
        results.push({ phone, success: true });
      }
    } catch (err) {
      console.error(`❌ CallMeBot failed for ${phone}:`, err.message);
      results.push({ phone, success: false, error: err.message });
    }
  }

  return { success: results.some(r => r.success), results };
};

const getWhatsappDirectLink = (phoneStr, text) => {
  const formatted = formatPhone(phoneStr);
  if (!formatted) return null;
  const cleanNumber = formatted.replace(/\+/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
};

const buildOrderWhatsappText = (order, customerName) => {
  const itemsText = (order.items || [])
    .map(item => `• ${item.product?.name || 'Item'} (Size: ${item.size}, Qty: ${item.quantity}) - ₹${(item.price_at_time * item.quantity).toLocaleString()}`)
    .join('\n');

  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  const subtotal = (order.items || []).reduce((s, i) => s + (i.price_at_time * i.quantity), 0);
  const discount = order.discount_amount || 0;
  const shipping = (order.total_price || 0) - subtotal + discount;
  const isUpi = getEffectivePaymentMethod(order).includes('UPI');

  return `🔔 *New Order Placed on Style Heaven!*
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
 * Sends a WhatsApp notification to the Admin and Customer when a new order is placed (COD or UPI).
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

  const messageBody = `🚨 *Order Cancelled on Style Heaven!*
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
