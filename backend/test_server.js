const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const dns = require('dns');
const axios = require('axios');

dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log('URL:', supabaseUrl);

// Test 1: Direct axios call to Supabase REST endpoint
async function testAxios() {
  console.log('\n--- Test 1: Direct Axios ---');
  try {
    const r = await axios.get(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      timeout: 15000,
    });
    console.log('✅ Axios direct: Status', r.status, 'data:', JSON.stringify(r.data));
  } catch (e) {
    console.log('❌ Axios direct error:', e.message, e.code);
    if (e.cause) console.log('  cause:', e.cause.message, e.cause.code);
  }
}

// Test 2: Native fetch (if available)
async function testFetch() {
  console.log('\n--- Test 2: Native fetch ---');
  if (typeof fetch === 'undefined') { console.log('fetch not available'); return; }
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    const data = await r.json();
    console.log('✅ Native fetch: Status', r.status, 'data:', JSON.stringify(data));
  } catch (e) {
    console.log('❌ Native fetch error:', e.message, e.cause?.message);
  }
}

// Test 3: Supabase client with native fetch (no custom fetch)
async function testSupabaseDefault() {
  console.log('\n--- Test 3: Supabase client (default fetch) ---');
  try {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await client.from('products').select('id').limit(1);
    if (error) console.log('❌ Supabase client error:', error.message, error.code);
    else console.log('✅ Supabase client default: rows =', data.length);
  } catch (e) {
    console.log('❌ Supabase client threw:', e.message);
  }
}

testAxios().then(testFetch).then(testSupabaseDefault).catch(console.error);
