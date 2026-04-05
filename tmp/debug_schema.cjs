const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAllColumns() {
  const { data, error } = await supabase.rpc('debug_get_columns', { p_table_name: 'products' });
  if (error) {
    // If RPC fails, try information_schema via a standard query (might not work over postgrest if not exposed)
    console.log('RPC failed. Trying query...');
    const { data: qData, error: qError } = await supabase.from('products').select('*').limit(0);
    // POSTGREST usually returns column names in the response headers or even if empty select.
    console.log('Error from select:', qError);
  } else {
    console.log('Columns:', data);
  }
}
getAllColumns();
