const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url) return resolve({ ok: false, status: 0, reason: 'empty' });
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
        resolve({ ok: res.statusCode < 400, status: res.statusCode, reason: '' });
      });
      req.on('error', (e) => resolve({ ok: false, status: 0, reason: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, reason: 'timeout' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 0, reason: e.message });
    }
  });
}

async function audit() {
  console.log('🔍 Fetching all products from Supabase...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, image_url')
    .order('category');

  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }
  console.log(`📦 Total products: ${products.length}\n`);

  const broken = [];
  const missing = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] Checking: ${p.name.slice(0, 50).padEnd(50)} `);

    if (!p.image_url) {
      console.log('❌ NO IMAGE URL');
      missing.push(p);
      continue;
    }

    const result = await checkUrl(p.image_url);
    if (result.ok) {
      console.log(`✅ OK (${result.status})`);
    } else {
      console.log(`❌ BROKEN (${result.status || result.reason})`);
      broken.push({ ...p, reason: result.reason || result.status });
    }
    await sleep(100);
  }

  console.log('\n══════════════════════════════════════════════');
  console.log(`📊 Audit Summary`);
  console.log(`  ✅ Working:  ${products.length - broken.length - missing.length}`);
  console.log(`  ❌ Broken:   ${broken.length}`);
  console.log(`  ⚠️  Missing:  ${missing.length}`);
  console.log('══════════════════════════════════════════════\n');

  if (broken.length || missing.length) {
    console.log('🔧 Products that need fixing:');
    [...missing, ...broken].forEach(p =>
      console.log(`  [${p.category}] ${p.id} | ${p.name}`)
    );
  }
}

audit().catch(console.error);
