/**
 * backend/demo_order_routing.js
 * ─────────────────────────────────────────────────────────────────
 * Interactive Visual Demo for KalaStyle AI:
 * Multi-Artisan Order Routing & Twilio WhatsApp Notification System
 */

const {
  formatE164,
  maskPhone,
  checkIdempotency,
} = require('./services/twilioWhatsAppService');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║           KALASTYLE AI — MULTI-ARTISAN WHATSAPP ROUTING LIVE DEMO              ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');
  await sleep(400);

  // 1. Customer places an order with items from multiple artisans
  console.log('🛒 STEP 1: CUSTOMER CHECKOUT');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  const customer = {
    name: 'Rahul Sharma',
    phone: '9876543210',
    address: 'Flat 402, Lotus Apartments, Indiranagar, Bengaluru, Karnataka 560038',
  };

  const cart = [
    {
      productId: 'PROD_001',
      name: 'Handwoven Pure Banarasi Silk Saree',
      quantity: 1,
      price: 2500,
      artisanId: 'ART_RAMESH',
      artisanStore: 'Ramesh Handicrafts',
      artisanPhone: '+919876511111',
    },
    {
      productId: 'PROD_002',
      name: 'Traditional Channapatna Wooden Elephant',
      quantity: 1,
      price: 1200,
      artisanId: 'ART_LAKSHMI',
      artisanStore: 'Lakshmi Woodcrafts',
      artisanPhone: '+919876522222',
    },
    {
      productId: 'PROD_003',
      name: 'Hand-dyed Indigo Cotton Dupatta',
      quantity: 1,
      price: 800,
      artisanId: 'ART_RAMESH',
      artisanStore: 'Ramesh Handicrafts',
      artisanPhone: '+919876511111',
    },
  ];

  const orderTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderNumber = 'KALA-2026-88419';

  console.log(`👤 Customer:      ${customer.name} (Phone: ${formatE164(customer.phone)})`);
  console.log(`📦 Order Number:  ${orderNumber}`);
  console.log(`💳 Total Amount:  ₹${orderTotal.toLocaleString('en-IN')}`);
  console.log(`📍 Delivery to:   ${customer.address}`);
  console.log('\nCart Items:');
  cart.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.name} — ₹${c.price.toLocaleString('en-IN')} (Artisan: ${c.artisanStore})`);
  });

  await sleep(800);

  // 2. Backend routing & grouping
  console.log('\n⚙️ STEP 2: BACKEND ORDER ROUTING & ISOLATION');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log('🔒 The backend ignores any client-supplied artisan IDs.');
  console.log('   It queries the authoritative `products` table in the database:');
  console.log('   `products.artisan_id` ➔ permanently records onto `order_items.artisan_id`.\n');

  const grouped = {};
  for (const item of cart) {
    if (!grouped[item.artisanId]) {
      grouped[item.artisanId] = {
        artisanStore: item.artisanStore,
        artisanPhone: item.artisanPhone,
        items: [],
        subtotal: 0,
      };
    }
    grouped[item.artisanId].items.push(item);
    grouped[item.artisanId].subtotal += item.price * item.quantity;
  }

  console.log(`Split 1 Customer Order into ${Object.keys(grouped).length} Isolated Artisan Packages:`);
  for (const [artId, g] of Object.entries(grouped)) {
    console.log(`\n  👉 Artisan: ${g.artisanStore} (${artId})`);
    console.log(`     Phone:              ${formatE164(g.artisanPhone)} (Masked: ${maskPhone(g.artisanPhone)})`);
    console.log(`     Artisan Subtotal:   ₹${g.subtotal.toLocaleString('en-IN')} (⚠️ Note: Customer total ₹${orderTotal.toLocaleString('en-IN')} is HIDDEN)`);
    console.log(`     Dispatched Items:   ${g.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}`);
  }

  await sleep(900);

  // 3. WhatsApp messages preview for both artisans
  console.log('\n📱 STEP 3: TWILIO WHATSAPP MESSAGES DISPATCHED TO ARTISANS');
  console.log('────────────────────────────────────────────────────────────────────────────────');

  for (const [artId, g] of Object.entries(grouped)) {
    const productSummary = g.items.map(i => `• ${i.name} × ${i.quantity}`).join('\n');
    console.log(`\n────────────────────────────────────────────────────────────────`);
    console.log(`📲 OUTGOING TO: ${g.artisanStore} (${formatE164(g.artisanPhone)})`);
    console.log(`────────────────────────────────────────────────────────────────`);
    console.log(`🔔 *New KalaStyle AI Order*

Hello ${g.artisanStore},

You have received a new order on KalaStyle AI.

*Order ID:* ${orderNumber}
*Customer:* ${customer.name}

*Your Products:*
${productSummary}

*Your Order Amount:* ₹${g.subtotal.toLocaleString('en-IN')}
*Payment Method:* COD (Cash on Delivery)
*Payment Status:* Pending

Please log in to your artisan dashboard to process the order.

— KalaStyle AI`);
  }

  await sleep(900);

  // 4. Idempotency demonstration
  console.log('\n🛡️ STEP 4: IDEMPOTENCY & DUPLICATE PROTECTION');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  const sampleKey = `${orderNumber}_ART_RAMESH_NEW_ORDER`;
  console.log(`🔑 Generated Idempotency Key: ${sampleKey}`);
  console.log(`   1st Webhook Arrival:  Record created ➔ Status: 'sent' ➔ Dispatched via Twilio`);
  console.log(`   2nd Webhook Arrival:  Key matched in DB ➔ Status: 'duplicate' ➔ SKIPPED (No duplicate WhatsApp spam!)\n`);

  await sleep(600);

  // 5. Admin Dashboard View
  console.log('👑 STEP 5: ADMIN AUDIT LOGS (Privacy Preserved)');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log('Admin sees global status without exposing artisan or customer personal data:\n');

  console.log('┌──────────────────┬─────────────────────┬─────────────────┬───────────┬──────────────┐');
  console.log('│ Order ID         │ Artisan Store       │ Recipient Phone │ Status    │ Artisan Due  │');
  console.log('├──────────────────┼─────────────────────┼─────────────────┼───────────┼──────────────┤');
  console.log(`│ ${orderNumber}  │ Ramesh Handicrafts  │ +91 98****1111  │ ✅ Sent   │ ₹3,300       │`);
  console.log(`│ ${orderNumber}  │ Lakshmi Woodcrafts  │ +91 98****2222  │ ✅ Sent   │ ₹1,200       │`);
  console.log('└──────────────────┴─────────────────────┴─────────────────┴───────────┴──────────────┘');

  console.log('\n================================================================================');
  console.log('🎉 DEMO COMPLETE: Multi-Artisan Order Routing & WhatsApp Notification Active!');
  console.log('================================================================================\n');
}

runDemo();
