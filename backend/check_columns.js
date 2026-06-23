require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addStockStatus() {
  console.log('Adding is_in_stock column to products table...');
  
  // Note: In Supabase, we usually do this via SQL. 
  // Since we don't have direct SQL access here, we can try to update a dummy product to see if it works.
  // Or better, we just assume we can add it or it might already exist as stock_quantity.
  
  // Actually, I'll check the current columns by fetching one product.
  const { data, error } = await supabase.from('products').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Current columns:', Object.keys(data[0]));
    if (!data[0].hasOwnProperty('is_in_stock')) {
      console.log('is_in_stock column missing. You should add it via Supabase SQL Editor:');
      console.log('ALTER TABLE products ADD COLUMN is_in_stock BOOLEAN DEFAULT TRUE;');
    } else {
      console.log('is_in_stock column already exists.');
    }
  } else {
    console.log('No products found to check columns.');
  }
}

addStockStatus();
