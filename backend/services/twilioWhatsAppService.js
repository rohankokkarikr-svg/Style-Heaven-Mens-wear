/**
 * backend/services/twilioWhatsAppService.js
 * ─────────────────────────────────────────────────────────────────
 * KalaStyle AI — Multi-Artisan Twilio WhatsApp Notification Service
 *
 * Responsibilities:
 * - Direct WhatsApp dispatch to product-owning artisans
 * - Phone number normalization to E.164 (+919876543210)
 * - Safe phone masking for audit trails (+91 98****3210)
 * - Strict Idempotency handling (order_id + artisan_id + message_type)
 * - Twilio Content Template Builder API support with dynamic variables {{1}}..{{7}}
 * - Elegant markdown text fallback for WhatsApp Sandbox & standard senders
 * - Fault tolerance: Twilio outages NEVER break customer checkout or payments
 * - Database logging with resilient local file fallback (data/whatsapp_logs.json)
 */

const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

// ── File-based Fallback Store Path ────────────────────────────────────────────
const LOGS_FILE = path.join(__dirname, '../data/whatsapp_logs.json');

const ensureLogsDir = () => {
  const dir = path.dirname(LOGS_FILE);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
};

const readFallbackLogs = () => {
  try {
    ensureLogsDir();
    if (fs.existsSync(LOGS_FILE)) {
      const content = fs.readFileSync(LOGS_FILE, 'utf8');
      return JSON.parse(content || '[]');
    }
  } catch (err) {
    console.warn('[twilioWhatsAppService] Read fallback logs error:', err.message);
  }
  return [];
};

const saveFallbackLog = (entry) => {
  try {
    ensureLogsDir();
    const logs = readFallbackLogs();
    const existingIdx = logs.findIndex(l => l.idempotency_key === entry.idempotency_key || l.id === entry.id);
    if (existingIdx >= 0) {
      logs[existingIdx] = { ...logs[existingIdx], ...entry, updated_at: new Date().toISOString() };
    } else {
      logs.unshift({ ...entry, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    // Retain latest 1000 logs
    const trimmed = logs.slice(0, 1000);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('[twilioWhatsAppService] Save fallback log error:', err.message);
  }
};

// ── Phone Normalization & Masking ─────────────────────────────────────────────

/**
 * Normalizes any Indian / International phone number to standard E.164 format.
 * Example: '9876543210' -> '+919876543210'
 * Example: '09876543210' -> '+919876543210'
 * Example: '+91 98765-43210' -> '+919876543210'
 */
const formatE164 = (phoneStr) => {
  if (!phoneStr) return null;
  let digits = String(phoneStr).replace(/\D/g, '');
  if (!digits) return null;

  // 10 digits (Standard Indian mobile)
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  // 11 digits starting with 0 (Indian STD/trunk prefix)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.substring(1)}`;
  }
  // 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  // Other international formats (10 to 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
};

/**
 * Masks phone numbers for secure admin view and audit logs.
 * Example: '+919876543210' -> '+91 98****3210'
 */
const maskPhone = (phoneStr) => {
  if (!phoneStr) return 'N/A';
  const clean = String(phoneStr).trim();
  if (clean.length < 8) return clean;
  const start = clean.slice(0, 5);
  const end = clean.slice(-4);
  return `${start}****${end}`;
};

// ── Twilio Client Factory ─────────────────────────────────────────────────────

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_SECRET;
  const apiKeySid = process.env.TWILIO_API_KEY_SID || (accountSid?.startsWith('SK') ? accountSid : null);
  const mainAccountSid = process.env.TWILIO_MAIN_ACCOUNT_SID || (accountSid?.startsWith('AC') ? accountSid : null);

  if (!accountSid || !authToken || authToken.startsWith('your_')) {
    return null;
  }

  try {
    if (apiKeySid && apiKeySid.startsWith('SK') && mainAccountSid && mainAccountSid.startsWith('AC')) {
      return twilio(apiKeySid, authToken, { accountSid: mainAccountSid });
    }
    if (accountSid && accountSid.startsWith('AC')) {
      return twilio(accountSid, authToken);
    }
  } catch (err) {
    console.error('[twilioWhatsAppService] Twilio init error:', err.message);
  }
  return null;
};

const getFromSender = () => {
  const rawFrom = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
  const clean = rawFrom.replace(/\s+/g, '').replace(/^whatsapp:/, '');
  return `whatsapp:${clean}`;
};

const getSmsSender = () => {
  const rawFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_FROM || '+17372508034';
  return rawFrom.replace(/\s+/g, '').replace(/^whatsapp:/, '');
};

// ── Idempotency Check & Logging ───────────────────────────────────────────────

/**
 * Checks if a WhatsApp notification for this exact order, artisan, and type has already been successfully sent.
 */
const checkIdempotency = async (idempotencyKey) => {
  if (!idempotencyKey) return false;

  // 1. Check Supabase
  try {
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .select('id, status, twilio_message_sid')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (!error && data) {
      if (['sent', 'delivered', 'queued'].includes(data.status)) {
        return { isDuplicate: true, record: data };
      }
    }
  } catch (dbErr) {
    // Schema might not exist yet
  }

  // 2. Check Fallback Logs
  const fallbackLogs = readFallbackLogs();
  const found = fallbackLogs.find(l => l.idempotency_key === idempotencyKey);
  if (found && ['sent', 'delivered', 'queued'].includes(found.status)) {
    return { isDuplicate: true, record: found };
  }

  return { isDuplicate: false, record: null };
};

/**
 * Saves or updates a notification audit record.
 */
const persistNotificationRecord = async (record) => {
  const payload = {
    order_id: record.order_id || null,
    artisan_id: record.artisan_id || null,
    phone_number: record.phone_number,
    message_type: record.message_type,
    idempotency_key: record.idempotency_key,
    template_sid: record.template_sid || null,
    twilio_message_sid: record.twilio_message_sid || null,
    status: record.status || 'queued',
    error_code: record.error_code || null,
    error_message: record.error_message || null,
    retry_count: record.retry_count || 0,
    payload_snapshot: record.payload_snapshot || null,
    sent_at: record.sent_at || null,
    updated_at: new Date().toISOString(),
  };

  // Always mirror to fallback file so data is never lost
  saveFallbackLog({ ...payload, id: record.id || `local_${Date.now()}` });

  // Attempt Supabase insert/update
  try {
    const { data: existing } = await supabase
      .from('whatsapp_notifications')
      .select('id')
      .eq('idempotency_key', record.idempotency_key)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('whatsapp_notifications')
        .update(payload)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('whatsapp_notifications')
        .insert([payload]);
    }
  } catch (err) {
    // If Supabase table is not yet created, the file log serves as active audit
    console.warn('[twilioWhatsAppService] DB log notice (using fallback store):', err.message);
  }
};

// ── Twilio Dispatch Engine ────────────────────────────────────────────────────

/**
 * Core dispatch function that sends WhatsApp messages via Twilio Content Template or freeform text.
 */
const dispatchTwilioWhatsApp = async ({
  toPhone,
  messageType,
  idempotencyKey,
  orderId,
  artisanId,
  templateSid,
  contentVariables,
  fallbackBodyText,
  snapshotData,
}) => {
  const e164 = formatE164(toPhone);

  if (!e164) {
    console.warn(`[twilioWhatsAppService] Skipped: Invalid phone number "${toPhone}"`);
    await persistNotificationRecord({
      order_id: orderId,
      artisan_id: artisanId,
      phone_number: toPhone || 'UNKNOWN',
      message_type: messageType,
      idempotency_key: idempotencyKey,
      status: 'skipped',
      error_code: 'INVALID_E164_PHONE',
      error_message: 'Artisan WhatsApp phone number is missing or not a valid international format',
      payload_snapshot: snapshotData,
    });
    return { success: false, skipped: true, reason: 'Invalid or missing phone number' };
  }

  // Idempotency check
  const { isDuplicate, record: prevRecord } = await checkIdempotency(idempotencyKey);
  if (isDuplicate) {
    console.log(`[twilioWhatsAppService] 🛡️ Idempotent skip: ${idempotencyKey} already sent (SID: ${prevRecord.twilio_message_sid})`);
    return { success: true, skipped: true, duplicate: true, messageSid: prevRecord.twilio_message_sid };
  }

  const client = getTwilioClient();
  const fromSender = getFromSender();
  const toDestination = `whatsapp:${e164}`;

  if (!client) {
    console.warn(`[twilioWhatsAppService] ⚠️ Twilio credentials missing in .env! Cannot send WhatsApp to ${maskPhone(e164)}`);
    await persistNotificationRecord({
      order_id: orderId,
      artisan_id: artisanId,
      phone_number: e164,
      message_type: messageType,
      idempotency_key: idempotencyKey,
      status: 'failed',
      error_code: 'MISSING_CREDENTIALS',
      error_message: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not configured in backend/.env',
      payload_snapshot: snapshotData,
    });
    return { success: false, reason: 'Twilio credentials not configured' };
  }

  console.log(`\n📲 [TWILIO WHATSAPP OUTGOING] ─────────────────────`);
  console.log(`Type:        ${messageType}`);
  console.log(`From:        ${fromSender}`);
  console.log(`To:          ${maskPhone(e164)} (${toDestination})`);
  console.log(`TemplateSID: ${templateSid || 'None (Using standard message text)'}`);
  console.log(`──────────────────────────────────────────────────\n`);

  try {
    let messageResult = null;

    // Case 1: WhatsApp Approved Content Template mode
    if (templateSid) {
      try {
        messageResult = await client.messages.create({
          from: fromSender,
          to: toDestination,
          contentSid: templateSid,
          contentVariables: JSON.stringify(contentVariables || {}),
        });
      } catch (tmplErr) {
        console.warn(`[twilioWhatsAppService] Content Template failed (${tmplErr.message}), falling back to direct body text...`);
      }
    }

    // Case 2: Direct message body text (or fallback if template was unapproved/not configured)
    if (!messageResult) {
      messageResult = await client.messages.create({
        from: fromSender,
        to: toDestination,
        body: fallbackBodyText,
      });
    }

    console.log(`✅ [Twilio WhatsApp Success] Sent to ${maskPhone(e164)} | SID: ${messageResult.sid} | Status: ${messageResult.status}`);

    await persistNotificationRecord({
      order_id: orderId,
      artisan_id: artisanId,
      phone_number: e164,
      message_type: messageType,
      idempotency_key: idempotencyKey,
      template_sid: templateSid || null,
      twilio_message_sid: messageResult.sid,
      status: messageResult.status || 'sent',
      sent_at: new Date().toISOString(),
      payload_snapshot: snapshotData,
    });

    return {
      success: true,
      messageSid: messageResult.sid,
      status: messageResult.status,
    };
  } catch (sendErr) {
    console.error(`❌ [Twilio WhatsApp Notice] WhatsApp channel restriction for ${maskPhone(e164)}: ${sendErr.message}`);

    // ── Resilient Channel Fallback: Attempt Direct Twilio SMS Dispatch ──
    try {
      const smsFrom = getSmsSender();
      if (smsFrom && client) {
        console.log(`📡 [Twilio Fallback] Dispatching SMS alert to ${maskPhone(e164)} from ${smsFrom}...`);
        let smsResult = null;

        // Try custom SMS body first
        try {
          smsResult = await client.messages.create({
            from: smsFrom,
            to: e164,
            body: fallbackBodyText ? fallbackBodyText.replace(/\*/g, '') : 'sms_order_confirmation',
          });
        } catch (customErr) {
          // If Twilio trial account enforces predefined SMS template (Code 572006)
          if (customErr.code === 572006 || /predefined SMS template/i.test(customErr.message)) {
            console.log(`📡 [Twilio Fallback] Applying Twilio approved template 'sms_order_confirmation'...`);
            smsResult = await client.messages.create({
              from: smsFrom,
              to: e164,
              body: 'sms_order_confirmation',
            });
          } else {
            throw customErr;
          }
        }

        if (smsResult && smsResult.sid) {
          console.log(`✅ [Twilio SMS Fallback Success] Sent to ${maskPhone(e164)} | SID: ${smsResult.sid} | Status: ${smsResult.status}`);

          await persistNotificationRecord({
            order_id: orderId,
            artisan_id: artisanId,
            phone_number: e164,
            message_type: messageType,
            idempotency_key: idempotencyKey,
            template_sid: templateSid || null,
            twilio_message_sid: smsResult.sid,
            status: smsResult.status || 'sent',
            sent_at: new Date().toISOString(),
            payload_snapshot: {
              ...snapshotData,
              channel: 'sms',
              twilio_body: smsResult.body || 'sms_order_confirmation',
              whatsapp_note: sendErr.message,
            },
          });

          return {
            success: true,
            channel: 'sms',
            messageSid: smsResult.sid,
            status: smsResult.status,
          };
        }
      }
    } catch (smsFallbackErr) {
      console.error(`❌ [Twilio SMS Fallback Error] Could not send SMS to ${maskPhone(e164)}:`, smsFallbackErr.message);
    }

    await persistNotificationRecord({
      order_id: orderId,
      artisan_id: artisanId,
      phone_number: e164,
      message_type: messageType,
      idempotency_key: idempotencyKey,
      template_sid: templateSid || null,
      status: 'failed',
      error_code: sendErr.code ? String(sendErr.code) : 'TWILIO_API_ERROR',
      error_message: sendErr.message,
      payload_snapshot: snapshotData,
    });

    return {
      success: false,
      error: sendErr.message,
      errorCode: sendErr.code,
    };
  }
};

// ── Public Artisan WhatsApp Operations ────────────────────────────────────────

/**
 * 1. SEND ARTISAN ORDER NOTIFICATION (COD or Initial Order Creation)
 * Triggered automatically when an order is created.
 * Strictly sends ONLY the artisan's owned products and calculated subtotal.
 */
const sendArtisanOrderWhatsApp = async ({
  artisan,
  order,
  items,
  subtotal,
  paymentMethod,
  paymentStatus,
}) => {
  if (!artisan) return { success: false, reason: 'No artisan details provided' };

  // Check opt-in preference (default true)
  if (artisan.whatsapp_notifications_enabled === false) {
    console.log(`[twilioWhatsAppService] Artisan ${artisan.store_name || artisan.id} has disabled WhatsApp notifications`);
    return { success: false, skipped: true, reason: 'Notifications disabled by artisan' };
  }

  const phone = artisan.whatsapp_number || artisan.phone;
  const artisanName = artisan.store_name || 'Artisan Partner';
  const orderNumber = order.order_number || String(order.id).substring(0, 8).toUpperCase();
  const customerName = order.shipping_name || order.user?.name || 'Customer';
  const effectiveMethod = paymentMethod?.toUpperCase() || (order.payment_method || 'COD').toUpperCase();
  const effectiveStatus = paymentStatus || (effectiveMethod.includes('COD') ? 'Pending' : 'Awaiting Payment');
  const artisanSubtotal = Number(subtotal || 0).toLocaleString('en-IN');

  // Format relevant products list
  const productSummaryLines = (items || []).map(i => {
    const name = i.product_name_snapshot || i.product?.name || i.name || 'Craft Product';
    const qty = i.quantity || 1;
    const size = i.size ? ` (${i.size})` : '';
    return `• ${name}${size} × ${qty}`;
  });
  const productSummary = productSummaryLines.join('\n') || '• Handcrafted Craft Item × 1';

  const idempotencyKey = `${order.id}_${artisan.id}_NEW_ORDER`;

  // Dynamic Template variables mapping:
  // {{1}} Artisan/Store Name
  // {{2}} Order ID
  // {{3}} Customer Name
  // {{4}} Relevant Product Summary
  // {{5}} Artisan Order Amount
  // {{6}} Payment Method
  // {{7}} Payment Status
  const contentVariables = {
    '1': artisanName,
    '2': orderNumber,
    '3': customerName,
    '4': productSummary,
    '5': artisanSubtotal,
    '6': effectiveMethod,
    '7': effectiveStatus,
  };

  const templateSid = process.env.TWILIO_ARTISAN_ORDER_TEMPLATE_SID || process.env.TWILIO_CONTENT_SID || null;

  // Formatted Body Text (spec section 11 & 12)
  const fallbackBodyText = `🔔 *New KalaStyle AI Order*

Hello ${artisanName},

You have received a new order on KalaStyle AI.

*Order ID:* ${orderNumber}
*Customer:* ${customerName}

*Your Products:*
${productSummary}

*Your Order Amount:* ₹${artisanSubtotal}
*Payment Method:* ${effectiveMethod}
*Payment Status:* ${effectiveStatus}

Please log in to your artisan dashboard to process the order.

— KalaStyle AI`;

  return await dispatchTwilioWhatsApp({
    toPhone: phone,
    messageType: 'NEW_ORDER',
    idempotencyKey,
    orderId: order.id,
    artisanId: artisan.id,
    templateSid,
    contentVariables,
    fallbackBodyText,
    snapshotData: { orderNumber, artisanName, artisanSubtotal, itemsCount: items?.length },
  });
};

/**
 * 2. SEND ARTISAN PAYMENT CONFIRMED NOTIFICATION (UPI / Razorpay Verified)
 * Triggered ONLY after backend HMAC-SHA256 signature verification or webhook confirmation.
 */
const sendArtisanPaymentWhatsApp = async ({
  artisan,
  order,
  items,
  subtotal,
  paymentMethod,
}) => {
  if (!artisan) return { success: false, reason: 'No artisan details provided' };

  if (artisan.whatsapp_notifications_enabled === false) {
    return { success: false, skipped: true, reason: 'Notifications disabled by artisan' };
  }

  const phone = artisan.whatsapp_number || artisan.phone;
  const artisanName = artisan.store_name || 'Artisan Partner';
  const orderNumber = order.order_number || String(order.id).substring(0, 8).toUpperCase();
  const customerName = order.shipping_name || order.user?.name || 'Customer';
  const effectiveMethod = (paymentMethod || order.payment_method || 'UPI').toUpperCase();
  const artisanSubtotal = Number(subtotal || 0).toLocaleString('en-IN');

  const productSummary = (items || []).map(i => {
    const name = i.product_name_snapshot || i.product?.name || i.name || 'Craft Product';
    const qty = i.quantity || 1;
    return `• ${name} × ${qty}`;
  }).join('\n') || '• Handcrafted Craft Item × 1';

  const idempotencyKey = `${order.id}_${artisan.id}_PAYMENT_CONFIRMED`;

  const contentVariables = {
    '1': artisanName,
    '2': orderNumber,
    '3': customerName,
    '4': productSummary,
    '5': artisanSubtotal,
    '6': effectiveMethod,
    '7': 'Paid',
  };

  const templateSid = process.env.TWILIO_ARTISAN_PAYMENT_TEMPLATE_SID || process.env.TWILIO_CONTENT_SID || null;

  const fallbackBodyText = `🔔 *New Paid Order*

Hello ${artisanName},

You have received a new paid order.

*Order ID:* ${orderNumber}
*Customer:* ${customerName}

*Your Products:*
${productSummary}

*Your Order Amount:* ₹${artisanSubtotal}
*Payment Method:* ${effectiveMethod}
*Payment Status:* Paid

Please open your artisan dashboard to process the order.

— KalaStyle AI`;

  return await dispatchTwilioWhatsApp({
    toPhone: phone,
    messageType: 'PAYMENT_CONFIRMED',
    idempotencyKey,
    orderId: order.id,
    artisanId: artisan.id,
    templateSid,
    contentVariables,
    fallbackBodyText,
    snapshotData: { orderNumber, artisanName, artisanSubtotal, paymentStatus: 'Paid' },
  });
};

/**
 * 3. SEND ARTISAN ORDER CANCELLATION NOTIFICATION
 */
const sendArtisanCancellationWhatsApp = async ({
  artisan,
  order,
  items,
  reason,
}) => {
  if (!artisan) return { success: false };

  const phone = artisan.whatsapp_number || artisan.phone;
  const artisanName = artisan.store_name || 'Artisan Partner';
  const orderNumber = order.order_number || String(order.id).substring(0, 8).toUpperCase();
  const idempotencyKey = `${order.id}_${artisan.id}_ORDER_CANCELLED`;

  const productSummary = (items || []).map(i => `• ${i.product_name_snapshot || i.product?.name || 'Item'} × ${i.quantity || 1}`).join('\n');

  const fallbackBodyText = `🚨 *Order Cancelled*

Hello ${artisanName},

Order *${orderNumber}* has been cancelled.

*Cancelled Products:*
${productSummary}

*Reason:* ${reason || 'Customer cancellation'}

Please stop preparation for this order. Inventory has been restored to your catalog.

— KalaStyle AI`;

  return await dispatchTwilioWhatsApp({
    toPhone: phone,
    messageType: 'ORDER_CANCELLED',
    idempotencyKey,
    orderId: order.id,
    artisanId: artisan.id,
    templateSid: null,
    contentVariables: null,
    fallbackBodyText,
    snapshotData: { orderNumber, artisanName, reason },
  });
};

/**
 * 4. RETRY FAILED NOTIFICATION
 */
const retryFailedWhatsAppNotification = async (notificationId) => {
  let record = null;

  // Search Supabase
  try {
    const { data } = await supabase
      .from('whatsapp_notifications')
      .select('*, orders(*), artisan_profiles(*)')
      .eq('id', notificationId)
      .maybeSingle();
    record = data;
  } catch (e) {}

  // Search Fallback
  if (!record) {
    const logs = readFallbackLogs();
    record = logs.find(l => l.id === notificationId || l.idempotency_key === notificationId);
  }

  if (!record) return { success: false, error: 'Notification record not found' };
  if (record.status === 'sent' || record.status === 'delivered') {
    return { success: true, message: 'Notification already delivered successfully' };
  }

  const client = getTwilioClient();
  if (!client) return { success: false, error: 'Twilio credentials not configured' };

  const fromSender = getFromSender();
  const toDestination = `whatsapp:${record.phone_number}`;

  try {
    const res = await client.messages.create({
      from: fromSender,
      to: toDestination,
      body: record.payload_snapshot?.bodyText || `🔔 *KalaStyle AI Notification Update*\nOrder: ${record.payload_snapshot?.orderNumber || 'KalaStyle'}\nPlease check your artisan dashboard.`,
    });

    await persistNotificationRecord({
      ...record,
      status: res.status || 'sent',
      twilio_message_sid: res.sid,
      retry_count: (record.retry_count || 0) + 1,
      error_message: null,
      error_code: null,
      sent_at: new Date().toISOString(),
    });

    return { success: true, messageSid: res.sid };
  } catch (err) {
    await persistNotificationRecord({
      ...record,
      status: 'failed',
      retry_count: (record.retry_count || 0) + 1,
      error_message: err.message,
    });
    return { success: false, error: err.message };
  }
};

/**
 * 5. RETRIEVE AUDIT LOGS FOR ADMIN
 */
const getWhatsAppLogs = async ({ limit = 50, offset = 0, status, search }) => {
  let logs = [];

  // Attempt database fetch first
  try {
    let query = supabase
      .from('whatsapp_notifications')
      .select(`
        *,
        artisan:artisan_profiles(id, store_name, location),
        order:orders(id, order_number, total_amount, payment_method)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      logs = data;
    }
  } catch (e) {}

  // Merge with fallback store if DB was empty or missing
  if (logs.length === 0) {
    const fileLogs = readFallbackLogs();
    logs = fileLogs.slice(offset, offset + limit);
  }

  // Securely mask all phone numbers in admin view
  const sanitized = logs.map(l => ({
    ...l,
    masked_phone: maskPhone(l.phone_number),
  }));

  return sanitized;
};

// ── Customer & Admin Notifications (Separate Channels) ────────────────────────

const sendCustomerWhatsApp = async ({ customerPhone, customerName, order, messageType, customText }) => {
  const e164 = formatE164(customerPhone);
  if (!e164) return { success: false, reason: 'Invalid customer phone' };
  const client = getTwilioClient();
  if (!client) return { success: false };

  const orderNum = order.order_number || String(order.id).substring(0, 8).toUpperCase();
  const bodyText = customText || `🎉 *Order Confirmed!* — KalaStyle AI\n\nHi ${customerName}, your order #${orderNum} has been received. Our master artisans are preparing your authentic crafts.`;

  try {
    const res = await client.messages.create({
      from: getFromSender(),
      to: `whatsapp:${e164}`,
      body: bodyText,
    });
    return { success: true, messageSid: res.sid };
  } catch (err) {
    console.error('[twilioWhatsAppService] Customer WhatsApp notice:', err.message);
    return { success: false, error: err.message };
  }
};

const sendAdminWhatsApp = async ({ adminPhone, order, customerName, items, paymentMethod }) => {
  const e164 = formatE164(adminPhone || process.env.ADMIN_WHATSAPP_PHONE || '917676558335');
  if (!e164) return { success: false };
  const client = getTwilioClient();
  if (!client) return { success: false };

  const orderNum = order.order_number || String(order.id).substring(0, 8).toUpperCase();
  const total = (order.total_amount || order.total_price || 0).toLocaleString('en-IN');

  const bodyText = `👑 *Admin Order Alert — KalaStyle AI*\n\nOrder #${orderNum} placed by ${customerName}.\nTotal: ₹${total} (${paymentMethod || 'COD'}).\nMulti-artisan routing completed automatically.`;

  try {
    const res = await client.messages.create({
      from: getFromSender(),
      to: `whatsapp:${e164}`,
      body: bodyText,
    });
    return { success: true, messageSid: res.sid };
  } catch (err) {
    console.error('[twilioWhatsAppService] Admin WhatsApp notice:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  formatE164,
  maskPhone,
  sendArtisanOrderWhatsApp,
  sendArtisanPaymentWhatsApp,
  sendArtisanCancellationWhatsApp,
  sendCustomerWhatsApp,
  sendAdminWhatsApp,
  retryFailedWhatsAppNotification,
  getWhatsAppLogs,
  checkIdempotency,
};
