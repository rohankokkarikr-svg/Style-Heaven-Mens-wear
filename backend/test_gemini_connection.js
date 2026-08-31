const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  console.log('=== Gemini Connection Test ===');
  console.log('Key set:', key ? 'YES (prefix: ' + key.slice(0, 12) + '...)' : 'NOT SET');
  console.log('Model:', model);

  if (!key) {
    console.error('ERROR: GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    console.log('\nSending test prompt...');

    const response = await ai.models.generateContent({
      model: model,
      contents: 'Reply with exactly this JSON and nothing else: {"status":"ok","model":"' + model + '","message":"Gemini AI is connected and working!"}',
    });

    console.log('\n✅ SUCCESS! Gemini responded:');
    console.log(response.text.trim());
    console.log('\n🎉 Your AI-powered handicrafts marketplace is fully operational!');
  } catch (err) {
    console.error('\n❌ CONNECTION FAILED');
    console.error('Error type:', err.constructor.name);
    console.error('Message:', err.message);
    if (err.message.includes('API_KEY_INVALID') || err.message.includes('PERMISSION_DENIED')) {
      console.error('\n⚠️  The API key appears to be invalid or lacks permissions.');
      console.error('   Please get a fresh key from: https://aistudio.google.com/app/apikey');
    }
  }
}

testGemini();
