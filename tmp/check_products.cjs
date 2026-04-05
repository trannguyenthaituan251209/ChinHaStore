const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const supabaseKey = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price_1day');
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log('--- LIVE DB PRODUCTS ---');
  data.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.name} | Price1Day: ${p.price_1day}`);
  });
  console.log('-------------------------');
}

checkProducts();
