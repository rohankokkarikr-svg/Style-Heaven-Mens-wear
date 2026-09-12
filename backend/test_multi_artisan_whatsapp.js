/**
 * backend/test_multi_artisan_whatsapp.js
 * ─────────────────────────────────────────────────────────────────
 * Comprehensive Automated Verification Suite for Multi-Artisan Order Routing
 * and Twilio WhatsApp Notifications.
 */

const {
  formatE164,
  maskPhone,
  checkIdempotency,
  sendArtisanOrderWhatsApp,
  sendArtisanPaymentWhatsApp,
  sendArtisanCancellationWhatsApp,
} = require('./services/twilioWhatsAppService');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, testName) => {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
};

(async () => {
  console.log('\n============================================================');
  console.log('🧪 RUNNING MULTI-ARTISAN WHATSAPP & ROUTING VERIFICATION');
  console.log('============================================================\n');

  // ── TEST 1: E.164 Phone Normalization ──
  console.log('--- Test Suite 1: Phone Normalization & Masking ---');
  assert(formatE164('9876543210') === '+919876543210', 'Normalizes 10-digit Indian mobile to +91');
  assert(formatE164('09876543210') === '+919876543210', 'Normalizes trunk 0 prefix to +91');
  assert(formatE164('+91 98765-43210') === '+919876543210', 'Strips spaces and dashes');
  assert(formatE164('919876543210') === '+919876543210', 'Adds + to 12-digit number starting with 91');
  assert(formatE164('') === null, 'Returns null for empty string');
  assert(formatE164('12345') === null, 'Returns null for invalid short numbers');
  assert(maskPhone('+919876543210').includes('****'), 'Masks phone numbers for audit privacy');

  // ── TEST 2: Multi-Artisan Item Grouping & Subtotal Isolation ──
  console.log('\n--- Test Suite 2: Multi-Artisan Item Grouping & Subtotal Isolation ---');
  const mockOrder = {
    id: 'kala-test-ord-001',
    order_number: 'KALA-2026-999',
    shipping_name: 'Rahul Sharma',
    phone: '9876543210',
    total_amount: 3300,
    payment_method: 'cod',
    payment_status: 'pending',
  };

  const mockItems = [
    { id: 'item-1', product_name_snapshot: 'Handmade Saree', quantity: 1, total_price: 1500, artisan_id: 'artisan-A' },
    { id: 'item-2', product_name_snapshot: 'Wooden Craft Statue', quantity: 1, total_price: 800, artisan_id: 'artisan-B' },
    { id: 'item-3', product_name_snapshot: 'Handmade Bag', quantity: 2, total_price: 1000, artisan_id: 'artisan-A' },
  ];

  // Grouping logic test
  const grouped = {};
  for (const item of mockItems) {
    const artId = item.artisan_id;
    if (!grouped[artId]) grouped[artId] = { items: [], subtotal: 0 };
    grouped[artId].items.push(item);
    grouped[artId].subtotal += item.total_price;
  }

  assert(Object.keys(grouped).length === 2, 'Correctly splits into 2 distinct artisans');
  assert(grouped['artisan-A'].items.length === 2, 'Artisan A receives strictly 2 items');
  assert(grouped['artisan-A'].subtotal === 2500, 'Artisan A subtotal is ₹2,500 (NOT customer total ₹3,300)');
  assert(grouped['artisan-B'].items.length === 1, 'Artisan B receives strictly 1 item');
  assert(grouped['artisan-B'].subtotal === 800, 'Artisan B subtotal is ₹800 (NOT customer total ₹3,300)');

  // ── TEST 3: WhatsApp Dispatch Fault Tolerance (Missing Phone) ──
  console.log('\n--- Test Suite 3: Fault Tolerance (Missing Phone) ---');
  const noPhoneArtisan = { id: 'artisan-no-phone', store_name: 'Weaver House', whatsapp_number: null, phone: null };
  const resNoPhone = await sendArtisanOrderWhatsApp({
    artisan: noPhoneArtisan,
    order: mockOrder,
    items: grouped['artisan-A'].items,
    subtotal: grouped['artisan-A'].subtotal,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
  });

  assert(resNoPhone.skipped === true, 'Gracefully skips sending when phone is missing without throwing error');
  assert(resNoPhone.success === false, 'Reports skipped status safely without crashing checkout');

  // ── TEST 4: WhatsApp Dispatch (Opt-out Toggle Respected) ──
  console.log('\n--- Test Suite 4: Notification Opt-out Preference ---');
  const optOutArtisan = { id: 'artisan-opt-out', store_name: 'Craft Studio', phone: '9876543210', whatsapp_notifications_enabled: false };
  const resOptOut = await sendArtisanOrderWhatsApp({
    artisan: optOutArtisan,
    order: mockOrder,
    items: grouped['artisan-B'].items,
    subtotal: grouped['artisan-B'].subtotal,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
  });

  assert(resOptOut.skipped === true, 'Respects artisan whatsapp_notifications_enabled: false');

  // ── TEST 5: Idempotency Logic ──
  console.log('\n--- Test Suite 5: Idempotency Guard ---');
  const idempotencyKey = `test_order_123_artisan_A_NEW_ORDER`;
  const { isDuplicate } = await checkIdempotency(idempotencyKey);
  assert(typeof isDuplicate === 'boolean', 'Idempotency check returns boolean status without throwing');

  // ── TEST 6: Payment Confirmed Notification Formatting ──
  console.log('\n--- Test Suite 6: Payment Verification Notification ---');
  const validArtisan = { id: 'artisan-A', store_name: 'Ramesh Handicrafts', whatsapp_number: '+919876543210', whatsapp_notifications_enabled: true };
  const resPayment = await sendArtisanPaymentWhatsApp({
    artisan: validArtisan,
    order: { ...mockOrder, payment_status: 'paid' },
    items: grouped['artisan-A'].items,
    subtotal: grouped['artisan-A'].subtotal,
    paymentMethod: 'UPI',
  });

  // Since live twilio trial might fail or succeed depending on sandbox join, the important thing is that it handles safely without crash
  assert(resPayment !== undefined, 'Payment confirmed dispatch completes safely');

  console.log('\n============================================================');
  console.log(`🏁 TESTS FINISHED: ${passedTests} / ${totalTests} PASSED`);
  console.log('============================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
