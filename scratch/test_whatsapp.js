const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { sendOrderWhatsappNotification } = require('../backend/utils/whatsapp');

// Mock order for testing
const mockOrder = {
  id: 'test-order-id-12345678',
  phone: '9876543210',
  shipping_address: '123 Test Street, Style Heaven Suite',
  total_price: 1500,
  discount_amount: 100,
  coupon_code: 'TEST100',
  payment_method: 'cod',
  items: [
    {
      quantity: 2,
      price_at_time: 800,
      size: 'L',
      product: {
        name: 'Classic Black T-Shirt',
        category: 'T-Shirts'
      }
    }
  ]
};

// Target phone number (either command line argument or the site settings default)
const targetPhone = process.argv[2] || '917349083982';

console.log('Initiating test WhatsApp notification...');
console.log(`To: +${targetPhone.replace(/\D/g, '')}`);
console.log('--- env status ---');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Loaded' : 'Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Loaded' : 'Missing');
console.log('TWILIO_WHATSAPP_FROM:', process.env.TWILIO_WHATSAPP_FROM || 'Missing');
console.log('------------------');

sendOrderWhatsappNotification(targetPhone, mockOrder, 'Test Customer')
  .then(res => {
    if (res.success) {
      console.log('🎉 Test message sent successfully!');
      console.log('Message SID:', res.sid);
    } else {
      console.error('❌ Failed to send test message:', res.error || res.reason);
      console.log('\nMake sure:');
      console.log('1. Your Twilio account credentials in backend/.env are correct.');
      console.log('2. The recipient phone number is joined to your Twilio Sandbox.');
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });
