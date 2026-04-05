const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
  console.log('--- TEST INSERT ---');
  // First, find a unit
  const { data: units } = await supabase.from('product_units').select('id').limit(1);
  if (!units || units.length === 0) return console.error('No units found');
  const unitId = units[0].id;
  console.log('Testing unitId:', unitId);

  // Try to find a customer
  const { data: customers } = await supabase.from('customers').select('id').limit(1);
  const customerId = customers?.[0]?.id;

  const { data, error } = await supabase.from('bookings').insert({
    customer_id: customerId,
    product_id: 'canon-r50',
    unit_id: unitId,
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    total_price: 1000,
    status: 'Pending'
  });

  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert Success!');
  }
}
testInsert();
