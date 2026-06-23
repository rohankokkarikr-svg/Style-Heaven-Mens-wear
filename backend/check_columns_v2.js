require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error(error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Sample product keys:', Object.keys(data[0]));
    const productsWithStock = data.filter(p => p.hasOwnProperty('stock_quantity') || p.hasOwnProperty('stock'));
    console.log(`Products with stock field: ${productsWithStock.length}/${data.length}`);
    if (productsWithStock.length > 0) {
      console.log('Stock field name:', productsWithStock[0].hasOwnProperty('stock_quantity') ? 'stock_quantity' : 'stock');
    }
  } else {
    console.log('No products found.');
  }
}

checkProducts();
