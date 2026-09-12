require('dotenv').config();
const { sendOrderWhatsappNotification, buildOrderWhatsappText, getWhatsappDirectLink } = require('./utils/whatsapp');

const adminPhone = process.argv[2] || process.env.ADMIN_WHATSAPP_NUMBER || process.env.ADMIN_PHONE || '917349083982';

console.log('\n================================================================');
console.log('📱 TESTING FULL ORDER WHATSAPP NOTIFICATION TO ADMIN');
console.log('================================================================');
console.log(`Admin WhatsApp Phone: +${adminPhone.replace(/\D/g, '')}`);
console.log(`Twilio Account SID:   ${process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 8) + '...' : 'MISSING'}`);
console.log(`Twilio WhatsApp From: ${process.env.TWILIO_WHATSAPP_FROM || '+14155238886'}`);
console.log('----------------------------------------------------------------\n');

// Sample realistic order payload with full details
const sampleOrder = {
  id: 'd3b9c1b3-0c15-4258-ac49-277246dc127b',
  order_number: 'KALA-202648329',
  phone: '7349083982',
  shipping_name: 'Rohan Kokkari',
  shipping_address: 'Flat 101, Kala Heritage Enclave, Indiranagar, Bengaluru, Karnataka',
  shipping_city: 'Bengaluru',
  shipping_state: 'Karnataka',
  shipping_pincode: '560038',
  live_location_url: 'https://www.google.com/maps?q=12.9786,77.364',
  payment_method: 'cod',
  payment_status: 'pending',
  order_status: 'confirmed',
  coupon_code: 'KALA30',
  discount_amount: 150,
  delivery_fee: 0,
  subtotal: 1200,
  total_amount: 1050,
  created_at: new Date().toISOString(),
  user: {
    name: 'Rohan Kokkari',
    phone: '7349083982',
    email: 'rohankokkarikr@gmail.com'
  },
  items: [
    {
      id: 'item-001',
      quantity: 1,
      size: 'Free Size',
      price_at_time: 1200,
      product_name_snapshot: 'Handcrafted Wooden Pull-Along Horse Toy with Rider',
      product: {
        id: 'prod-001',
        name: 'Handcrafted Wooden Pull-Along Horse Toy with Rider',
        category: 'Wooden Handicrafts',
        price: 1200
      }
    }
  ]
};

(async () => {
  try {
    console.log('📝 Generating Full Order Details Slip for WhatsApp:\n');
    const orderSlip = buildOrderWhatsappText(sampleOrder, sampleOrder.shipping_name);
    console.log(orderSlip);
    console.log('\n================================================================');
    console.log('🚀 Dispatching to Admin via Twilio API...');
    console.log('================================================================');

    const result = await sendOrderWhatsappNotification(adminPhone, sampleOrder, sampleOrder.shipping_name);

    console.log('\n--- DISPATCH RESULTS ---');
    console.log(`Success:    ${result.success ? '✅ YES' : '❌ NO (Check Twilio trial/template status)'}`);
    console.log(`Direct Link: ${result.directLink}`);

    if (result.results && result.results.length > 0) {
      result.results.forEach((r, idx) => {
        console.log(`Recipient #${idx + 1} (${r.to}): ${r.success ? `Delivered (SID: ${r.sid})` : `Failed (${r.error})`}`);
      });
    }

    console.log('\n================================================================');
    console.log('🔗 DIRECT WHATSAPP LINK FOR ADMIN (1-Click Open in WhatsApp):');
    console.log(result.directLink);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal error in test script:', err);
  }
})();
