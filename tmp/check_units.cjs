const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUnits() {
  const { data, error } = await supabase.from('product_units').select('id, unit_name, product_id');
  if (error) return console.error(error);
  console.log('Product Units:', data.length);
  if (data.length > 0) console.log(JSON.stringify(data[0], null, 2));
}
checkUnits();
