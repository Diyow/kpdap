require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkView() {
  const { data, error } = await supabase.rpc('query_system_view', { query: `SELECT definition FROM pg_views WHERE viewname = 'customers_summary';` });
  
  if (error) {
    // try direct SQL if RPC doesn't exist
    console.log("no rpc, trying raw query");
  } else {
    console.log(data);
  }
}
checkView();
