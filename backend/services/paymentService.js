const Razorpay = require('razorpay');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Merchant UPI ID for direct UPI transfers (fallback)
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || 'styleheaven@upi';
const MERCHANT_NAME = process.env.MERCHANT_NAME || 'Style Heaven Mens Wear';

/**
 * Create a Razorpay order
 */
exports.createRazorpayOrder = async (amount, receipt, notes = {}) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate UPI QR Code data (UPI Pay URL format)
 * This works with all UPI apps: GPay, PhonePe, Paytm, BHIM
 */
exports.generateUPIURI = (amount, transactionId, orderId) => {
  // Standard UPI Pay URI format
  const upiId = MERCHANT_UPI_ID;
  const name = encodeURIComponent(MERCHANT_NAME);
  const txnId = encodeURIComponent(transactionId);
  const txnNote = encodeURIComponent(`Order #${orderId}`);
  const amt = amount.toFixed(2);

  // UPI Intent URI
  const upiURI = `upi://pay?pa=${upiId}&pn=${name}&am=${amt}&tr=${txnId}&tn=${txnNote}&cu=INR`;

  return upiURI;
};

/**
 * Generate QR Code as base64 image
 */
exports.generateQRCode = async (upiURI) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(upiURI, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return { success: true, qrCode: qrDataUrl };
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get UPI app deep links for intent-based payments
 */
exports.getUPIDeepLinks = (upiURI, amount, transactionId) => {
  const encodedURI = encodeURIComponent(upiURI);

  return {
    // Google Pay
    gpay: `tez://upi/pay?${upiURI.split('?')[1]}`,
    // PhonePe
    phonepe: `phonepe://pay?${upiURI.split('?')[1]}`,
    // Paytm
    paytm: `paytmmp://upi/pay?${upiURI.split('?')[1]}`,
    // BHIM
    bhim: `bhim://upi/pay?${upiURI.split('?')[1]}`,
    // Generic UPI
    generic: upiURI,
  };
};

/**
 * Verify Razorpay payment signature
 */
exports.verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Verify Razorpay webhook signature
 */
exports.verifyWebhookSignature = (body, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 */
exports.getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error('Fetch payment failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch order details from Razorpay
 */
exports.getOrderDetails = async (orderId) => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return { success: true, order };
  } catch (error) {
    console.error('Fetch order failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a refund
 */
exports.createRefund = async (paymentId, amount, notes = {}) => {
  try {
    const options = {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes,
    };

    const refund = await razorpay.payments.refund(paymentId, options);
    return { success: true, refund };
  } catch (error) {
    console.error('Refund creation failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a unique transaction ID
 */
exports.generateTransactionId = (orderId) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SH${orderId?.substring(0, 8).toUpperCase() || ''}${timestamp}${random}`;
};

// Also export razorpay instance for direct use
exports.razorpay = razorpay;
