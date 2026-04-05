const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listR50() {
  const { data, error } = await supabase.from('products').select('id, name');
  if (error) {
    console.error(error);
    return;
  }
  const r50s = data.filter(p => p.name.includes('Canon EOS R50'));
  console.log('R50 Products:', JSON.stringify(r50s, null, 2));
}
listR50();
