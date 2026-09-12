/**
 * backend/test_real_order_sagar.js
 * ─────────────────────────────────────────────────────────────────
 * Real Order Creation and Multi-Artisan WhatsApp Routing Test
 * Targets: Sagar's Shop products in the live database.
 */

const supabase = require('./config/supabase');
const { createMasterOrder, routeAndNotifyArtisans } = require('./services/orderService');

(async () => {
  console.log('\n================================================================');
  console.log('🚀 TESTING REAL ORDER DISPATCH FOR SAGAR\'S SHOP PRODUCT');
  console.log('================================================================\n');

  // 1. Fetch Sagar's Shop and his real product from the database
  const { data: artisan, error: artErr } = await supabase
    .from('artisan_profiles')
    .select('id, store_name, phone, whatsapp_number, user_id, users(name, phone, email)')
    .ilike('store_name', "%sagar%")
    .single();

  if (artErr || !artisan) {
    console.error('❌ Could not find Sagar in artisan_profiles:', artErr);
    process.exit(1);
  }

  console.log('🎨 Target Artisan in Database:');
  console.log(`   Store Name:      ${artisan.store_name}`);
  console.log(`   Artisan ID:      ${artisan.id}`);
  console.log(`   WhatsApp Number: ${artisan.whatsapp_number || artisan.users?.phone}`);
  console.log(`   Owner User:      ${artisan.users?.name} (${artisan.users?.phone})\n`);

  // 2. Fetch a product owned by Sagar's Shop
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('artisan_id', artisan.id)
    .limit(1);

  if (prodErr || !products || products.length === 0) {
    console.error('❌ No product found for Sagar:', prodErr);
    process.exit(1);
  }

  const sagarProduct = products[0];
  console.log('📦 Selected Product from Sagar\'s Shop:');
  console.log(`   Product ID:      ${sagarProduct.id}`);
  console.log(`   Product Name:    ${sagarProduct.name}`);
  console.log(`   Price:           ₹${sagarProduct.price}`);
  console.log(`   Stock:           ${sagarProduct.stock_quantity}\n`);

  // 3. Customer placing the order
  const customerUserId = 'f866ba00-0b20-43a6-ad02-b707c7e57b00'; // Rohan Kokkari
  const shippingData = {
    name: 'Rohan Customer',
    phone: '7349083982',
    address: 'Flat 101, Kala Heritage Enclave, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
  };

  console.log('🛒 Placing Real Order via createMasterOrder()...');
  const result = await createMasterOrder({
    userId: customerUserId,
    items: [
      {
        product_id: sagarProduct.id,
        quantity: 1,
        size: 'Standard',
      }
    ],
    shippingData,
    paymentMethod: 'cod',
    couponCode: null,
    liveLocationUrl: 'https://maps.google.com/?q=12.9716,77.5946',
  });

  if (result.error) {
    console.error('❌ Order creation failed:', result.error);
    process.exit(1);
  }

  const { order, artisanOrders } = result;
  console.log('✅ Real Order Successfully Created in Database!');
  console.log(`   Order ID:        ${order.id}`);
  console.log(`   Order Number:    ${order.order_number}`);
  console.log(`   Total Amount:    ₹${order.total_amount}`);
  console.log(`   Payment Method:  ${order.payment_method.toUpperCase()}`);
  console.log(`   Artisan Suborders Created: ${artisanOrders?.length}\n`);

  // 4. Trigger the multi-artisan WhatsApp routing engine
  console.log('📲 Invoking routeAndNotifyArtisans()...');
  const routeResult = await routeAndNotifyArtisans(order, 'NEW_ORDER');

  console.log('\n================================================================');
  console.log('📊 ROUTING & NOTIFICATION RESULTS');
  console.log('================================================================');
  console.log(JSON.stringify(routeResult, null, 2));

  // 5. Inspect the audit record in whatsapp_notifications table
  const { data: auditLog } = await supabase
    .from('whatsapp_notifications')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();

  if (auditLog) {
    console.log('\n📋 Audit Record in Supabase (whatsapp_notifications):');
    console.log(`   Status:       ${auditLog.status}`);
    console.log(`   Phone Number: ${auditLog.phone_number}`);
    console.log(`   Message SID:  ${auditLog.twilio_message_sid || 'N/A'}`);
    console.log(`   Error Code:   ${auditLog.error_code || 'None'}`);
    console.log(`   Error Info:   ${auditLog.error_message || 'None'}`);
  }

  console.log('\n✨ Test Complete!\n');
})();
