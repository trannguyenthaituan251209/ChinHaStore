const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
  console.log('Data:', data);
  console.log('Error:', error);
}
check();
