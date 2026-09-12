/**
 * backend/send_whatsapp_sagar.js
 * ─────────────────────────────────────────────────────────────────
 * Dispatches complete order details message to Sagar (+917892470438)
 * via Twilio WhatsApp Sandbox (+14155238886).
 */

require('dotenv').config();
const twilio = require('twilio');
const supabase = require('./config/supabase');

async function sendCompleteOrderToSagar() {
  console.log('\n================================================================');
  console.log('📲 DISPATCHING COMPLETE ORDER DETAILS TO SAGAR VIA WHATSAPP');
  console.log('================================================================\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  // 1. Fetch Sagar's Shop and his real product
  const { data: artisan } = await supabase
    .from('artisan_profiles')
    .select('id, store_name, phone, whatsapp_number, user_id')
    .ilike('store_name', '%sagar%')
    .single();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('artisan_id', artisan.id)
    .limit(1);

  const product = products[0];

  // 2. Format the complete rich WhatsApp message
  const orderNumber = 'KALA-202694181';
  const customerName = 'Rohan Customer';
  const customerPhone = '+91 7349083982';
  const shippingAddress = 'Flat 101, Kala Heritage Enclave, Indiranagar, Bengaluru, Karnataka - 560038';
  const subtotal = Number(product.price).toLocaleString('en-IN');

  const completeMessageText = `🎨 *KalaStyle AI — New Order Received!*

Hello *${artisan.store_name}*,

You have received a new order for your handcrafted products:

📦 *Order Number:* #${orderNumber}
👤 *Customer:* ${customerName}
📞 *Customer Phone:* ${customerPhone}
📍 *Shipping Address:* ${shippingAddress}

🛒 *Your Ordered Products:*
• 1x ${product.name} — ₹${subtotal}

💰 *Your Order Payout:* ₹${subtotal}
💳 *Payment Method:* Cash on Delivery (COD)
⚡ *Status:* Confirmed (Awaiting dispatch)

🔗 *Process & Ship in Artisan Dashboard:*
https://kalastyle.ai/artisan/orders

— KalaStyle AI Marketplace`;

  console.log('📝 Message Payload to be sent:\n');
  console.log(completeMessageText);
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log(`From: whatsapp:+14155238886 (Twilio WhatsApp Sandbox)`);
  console.log(`To:   whatsapp:+917892470438 (Sagar's WhatsApp)`);
  console.log('────────────────────────────────────────────────────────────────\n');

  try {
    const res = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+917892470438',
      body: completeMessageText,
    });

    console.log('🎉 SUCCESS! Complete Order Details Dispatched to Sagar\'s WhatsApp!');
    console.log(`   Message SID: ${res.sid}`);
    console.log(`   Status:      ${res.status}`);
    console.log(`   Direction:   ${res.direction}`);
    console.log('\n✅ Sagar will now see the complete order slip inside WhatsApp.\n');
  } catch (err) {
    if (err.code === 21654 || err.code === 63016 || /ContentSid/i.test(err.message)) {
      console.log('⚠️ [Action Required on Sagar\'s Phone]');
      console.log('Sagar has not joined the Twilio WhatsApp Sandbox yet.\n');
      console.log('👉 Quick 10-Second Setup:');
      console.log('   1. On phone +91 7892470438, open WhatsApp');
      console.log('   2. Send a message to: +1 415 523 8886');
      console.log('   3. Type: join <your-sandbox-keyword>');
      console.log('      (Find your keyword in Twilio Console -> Messaging -> Try it out -> Send a WhatsApp message)');
      console.log('   4. After Sagar sends that message, run this script again and the complete message will deliver instantly!\n');
    } else {
      console.error('❌ Twilio Error:', err.message, '| Code:', err.code);
    }
  }
}

sendCompleteOrderToSagar();
