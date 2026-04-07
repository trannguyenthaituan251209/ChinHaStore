const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient('https://jlxccojxwrfgtowyhhjk.supabase.co', 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy');

async function checkCustomer() {
  const { data: customers } = await supabase.from('customers').select('*').limit(50);
  const { data: bookings } = await supabase.from('bookings').select('*, customers(*)').order('created_at', { ascending: false }).limit(10);
  
  const report = { customers, bookings };
  fs.writeFileSync('c:/Users/thait/Desktop/ChinHaStore_Offical/tmp/db_report.json', JSON.stringify(report, null, 2));
  console.log('SUCCESS: Report written to tmp/db_report.json');
}
checkCustomer();
