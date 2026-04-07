const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jlxccojxwrfgtowyhhjk.supabase.co', 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy');

async function checkSchema() {
  console.log('--- Inspecting Columns in "bookings" table ---');
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    console.log('Table exists but is empty. Trying to fetch row with any data...');
    const { data: allData } = await supabase.from('bookings').select('*').limit(5);
    if (allData && allData.length > 0) {
        console.log('Sample columns:', Object.keys(allData[0]));
    } else {
        console.log('Table is completely empty. Fetching table definition via RPC (if enabled)...');
    }
  }
}

checkSchema();
