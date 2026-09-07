const path = require('path');
try {
  require('./backend/node_modules/dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
} catch (e) {
  try {
    require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
  } catch (err) {}
}

const supabase = require('./backend/config/supabase');

async function testConnection() {
  console.log('🔗 Testing Supabase Connection to:', process.env.SUPABASE_URL);

  const tables = ['users', 'products', 'categories', 'orders', 'platform_settings'];
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' }).limit(1);
    if (error) {
      console.log(`❌ Table [${table}]: ${error.message}`);
    } else {
      console.log(`✅ Table [${table}]: Connected (${count !== null ? count : data.length} rows)`);
    }
  }
  console.log('🚀 Supabase Database connection test completed successfully!');
}

testConnection();

