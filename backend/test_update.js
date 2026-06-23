require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testUpdate() {
  const { data: products } = await supabase.from('products').select('id').limit(1);
  if (!products || products.length === 0) {
    console.log('No products found');
    return;
  }
  
  const id = products[0].id;
  console.log(`Attempting to update product ${id} with is_in_stock...`);
  
  const { data, error } = await supabase
    .from('products')
    .update({ is_in_stock: false })
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Update failed as expected:', error.message, error.code);
  } else {
    console.log('Update succeeded unexpectedly (maybe column exists?):', data);
  }
}

testUpdate();
