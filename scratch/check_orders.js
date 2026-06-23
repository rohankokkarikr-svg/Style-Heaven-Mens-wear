const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkUserOrders() {
  const email = 'test@example.com'; // Or the user's email
  
  const { data: user } = await supabase
    .from('users')
    .select('id, name')
    .eq('email', email)
    .single();

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`Checking orders for ${user.name} (${user.id})`);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_price, created_at')
    .eq('user_id', user.id);

  console.log(`Found ${orders.length} orders:`);
  console.table(orders);

  const orderIds = orders.map(o => o.id);
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id, quantity, products(name, category)')
      .in('order_id', orderIds);

    console.log('Order Items:');
    items.forEach(item => {
      console.log(`Order ${item.order_id}: ${item.quantity}x ${item.products?.name} (${item.products?.category})`);
    });
  }
}

checkUserOrders();
