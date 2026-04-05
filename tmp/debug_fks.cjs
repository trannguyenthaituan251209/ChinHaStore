const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  console.log('--- DB DEBUG ---');
  
  // 1. Check Product
  const { data: p } = await supabase.from('products').select('id, name').eq('id', 'canon-r50').single();
  console.log('Main Product:', p);

  // 2. Check Units
  const { data: units } = await supabase.from('product_units').select('id, unit_name, product_id').eq('product_id', 'canon-r50');
  console.log('Total Units for R50:', units?.length || 0);
  if (units && units.length > 0) {
    console.log('Sample Unit:', JSON.stringify(units[0], null, 2));
  }

  // 3. Check Bookings FKs (just to see if anything is there)
  const { data: bookings } = await supabase.from('bookings').select('id, unit_id').limit(1);
  console.log('Sample Booking Unit ID:', bookings?.[0]?.unit_id);
}
debug();
