require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('customers_summary').select('*').then(res => {
  console.log('--- customers_summary ---');
  console.log(JSON.stringify(res, null, 2));
});

supabase.from('customers').select('*').then(res => {
  console.log('--- customers ---');
  console.log(JSON.stringify(res, null, 2));
});

supabase.from('orders').select('*').then(res => {
  console.log('--- orders ---');
  console.log(JSON.stringify(res, null, 2));
});
