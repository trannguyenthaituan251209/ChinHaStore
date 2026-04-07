const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient('https://jlxccojxwrfgtowyhhjk.supabase.co', 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy');

async function checkSchema() {
  // Query to find constraints on 'customers' table in PostgreSQL
  const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'customers' });
  
  if (error) {
     // Fallback: try to insert a duplicate phone and see if it fails
     console.log('RPC failed, trying a duplicate phone insert test...');
     const { error: insErr } = await supabase.from('customers').insert({
       phone: '0842204207', 
       full_name: 'TEST_DUPLICATE_NAME_CHECK_' + Date.now()
     });
     if (insErr) {
       console.log('INSERT FAILED: Likely a UNIQUE phone constraint exists.', insErr.message);
     } else {
       console.log('INSERT SUCCESS: Phone is NOT strictly unique. Multi-customer logic is possible!');
     }
  } else {
     console.log('CONSTRAINTS:', data);
  }
}
checkSchema();
