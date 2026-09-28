require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function backfill() {
  const { data: orders } = await supabase.from('orders').select('customer_phone, customer_name, customer_email');
  if (!orders) return;
  
  const uniqueCustomers = {};
  for (const o of orders) {
    if (!uniqueCustomers[o.customer_phone]) {
      uniqueCustomers[o.customer_phone] = {
        phone: o.customer_phone,
        name: o.customer_name,
        email: o.customer_email || null
      };
    }
  }
  
  const customersToInsert = Object.values(uniqueCustomers);
  console.log(`Upserting ${customersToInsert.length} customers...`);
  
  for (const c of customersToInsert) {
    await supabase.from('customers').upsert(c, { onConflict: 'phone' });
  }
  
  console.log('Done!');
}

backfill();
