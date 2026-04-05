const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedInventoryUnits() {
  console.log('--- SEEDING INVENTORY_UNITS ---');

  // 1. Fetch all products
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr) return console.error('Fetch products error:', pErr);

  const allUnitsToInsert = [];

  for (const product of products) {
    // 10 for Canon R50, 1 for others
    const unitCount = product.name.includes('Canon EOS R50') ? 10 : 1;
    
    for (let i = 1; i <= unitCount; i++) {
        allUnitsToInsert.push({
            product_id: product.id,
            serial_number: `${product.name} #${i}`, // Make it unique across the store
            current_hub: 'Hồ Chí Minh',
            status: 'Available'
        });
    }
  }

  // 2. Bulk Insert into inventory_units
  console.log(`Inserting ${allUnitsToInsert.length} units into inventory_units...`);
  const { error: uErr } = await supabase.from('inventory_units').insert(allUnitsToInsert);
  
  if (uErr) {
    console.error('Bulk insert error:', JSON.stringify(uErr, null, 2));
  } else {
    console.log('Successfully seeded inventory_units!');
  }
}

seedInventoryUnits();
