require('dotenv').config();
const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    console.log('Generating hash for "admin123"...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    console.log('Updating password for rohankokkarikr@gmail.com...');
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', 'rohankokkarikr@gmail.com')
      .select();

    if (error) throw error;
    console.log('Password reset successfully! New password is: admin123');
    console.log('Updated user:', data);
  } catch (err) {
    console.error('Error resetting password:', err);
  }
}

resetPassword();
