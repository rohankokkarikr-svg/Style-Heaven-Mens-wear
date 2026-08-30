require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_SECRET || '';
const apiKeySid = process.env.TWILIO_API_KEY_SID || (accountSid.startsWith('SK') ? accountSid : null);
const mainAccountSid = process.env.TWILIO_MAIN_ACCOUNT_SID || (accountSid.startsWith('AC') ? accountSid : null);
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || '+14155238886';

console.log('\n========================================');
console.log('🔍 Testing Twilio Connection...');
console.log('========================================');

if (!authToken || authToken.startsWith('your_')) {
  console.log('❌ TWILIO_AUTH_TOKEN is missing in backend/.env');
  process.exit(1);
}

// Check if using API Key (SK...) without Main Account SID (AC...)
if (apiKeySid && apiKeySid.startsWith('SK') && (!mainAccountSid || !mainAccountSid.startsWith('AC'))) {
  console.log('⚠️ You pasted an API Key (starts with SK...) in TWILIO_ACCOUNT_SID.');
  console.log('👉 Twilio API Keys require your main Account SID (starts with AC...) as well.');
  console.log('\nPlease add your Main Account SID to backend/.env like this:');
  console.log('TWILIO_MAIN_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  console.log('TWILIO_API_KEY_SID=' + apiKeySid);
  console.log('TWILIO_AUTH_TOKEN=' + authToken);
  console.log('\n(Your Account SID starting with AC is on the top of your Twilio Console home page: https://console.twilio.com/)');
  process.exit(1);
}

let client;
try {
  if (apiKeySid && apiKeySid.startsWith('SK') && mainAccountSid && mainAccountSid.startsWith('AC')) {
    client = twilio(apiKeySid, authToken, { accountSid: mainAccountSid });
  } else {
    client = twilio(accountSid, authToken);
  }
} catch (err) {
  console.error('❌ Failed to initialize Twilio client:', err.message);
  process.exit(1);
}

(async () => {
  try {
    const targetSid = mainAccountSid || accountSid;
    const account = await client.api.v2010.accounts(targetSid).fetch();
    console.log('✅ Connected to Twilio successfully!');
    console.log(`👤 Account Name:   ${account.friendlyName}`);
    console.log(`⚡ Account Status: ${account.status}`);
    console.log(`📱 WhatsApp From:   ${fromNumber}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Twilio Connection Failed:');
    console.error(`   Error Message: ${error.message}`);
    console.log('\nPlease check that your Account SID and Token/Secret in backend/.env are valid.\n');
  }
})();
