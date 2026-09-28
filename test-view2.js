require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  await supabase.from('orders').insert({
    customer_name: `Mock Customer 2`,
    customer_phone: '081234567802',
    customer_email: `customer2@example.com`,
    shipping_address: `Test`,
    total_amount: 100000,
    status: 'paid'
  });
  
  await supabase.from('orders').insert({
    customer_name: `Mock Customer 2`,
    customer_phone: '081234567802',
    customer_email: `customer2@example.com`,
    shipping_address: `Test`,
    total_amount: 200000,
    status: 'shipped'
  });

  await supabase.from('orders').insert({
    customer_name: `Mock Customer 2`,
    customer_phone: '081234567802',
    customer_email: `customer2@example.com`,
    shipping_address: `Test`,
    total_amount: 400000,
    status: 'processing'
  });
  
  const { data } = await supabase.from('customers_summary').select('*').eq('phone', '081234567802');
  console.log(data);
}
test();
