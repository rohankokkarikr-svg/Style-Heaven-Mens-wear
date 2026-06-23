require('dotenv').config({ path: './backend/.env' });
const supabase = require('./backend/config/supabase');

async function testAuth() {
  console.log('Testing users table...');
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users:', data);
  }
}

testAuth();
