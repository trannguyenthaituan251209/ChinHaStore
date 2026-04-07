const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient('https://jlxccojxwrfgtowyhhjk.supabase.co', 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy');

async function checkCols() {
  const { data: bData } = await supabase.from('bookings').select('*').limit(1);
  console.log('Bookings columns:', Object.keys(bData[0] || {}));
}
checkCols();
