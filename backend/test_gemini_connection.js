const gemini = require('./services/geminiService');
require('dotenv').config();

async function testGemini() {
  console.log('=== Gemini Connection Test ===');
  console.log('GEMINI_API_KEY configured:', gemini.isKeyConfigured());
  console.log('Model:', gemini.getModelName());

  if (!gemini.isKeyConfigured()) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in environment.');
    process.exit(1);
  }

  console.log('\nSending test prompt to Gemini...');
  const health = await gemini.checkHealth();

  if (health.status === 'ok') {
    console.log('\n✅ SUCCESS! Gemini responded:');
    console.log(health.testResponseSnippet);
    console.log('Latency:', health.latencyMs + 'ms');
    console.log('\n🎉 Your AI-powered handicrafts marketplace is fully operational!');
  } else {
    console.error('\n❌ CONNECTION FAILED');
    console.error('Status:', health.status);
    console.error('Error Type:', health.errorType);
    console.error('Message:', health.message);
    if (health.details) {
      console.error('Details:', health.details);
    }
  }
}

testGemini();
