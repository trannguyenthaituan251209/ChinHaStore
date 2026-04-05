const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
  console.log('--- STARTING INVENTORY CONSOLIDATION ---');

  // 1. Fetch all products
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr) return console.error('Fetch products error:', pErr);

  // 2. Group by "Base Name"
  const getBaseName = (name) => name.replace(/\s#\d+$/, '').trim();
  const groups = {};
  products.forEach(p => {
    const base = getBaseName(p.name);
    if (!groups[base]) groups[base] = [];
    groups[base].push(p);
  });

  const allUnitsToInsert = [];
  const allIdsToDelete = [];
  const primaryIdMap = {}; // baseName -> primaryId

  for (const [baseName, plist] of Object.entries(groups)) {
    // Pick the "Primary" product
    let primary = plist.find(p => !p.name.includes('#'));
    if (!primary) primary = plist[0];
    primaryIdMap[baseName] = primary.id;

    // Plan units
    const unitCount = baseName.includes('Canon EOS R50') ? 10 : 1;
    for (let i = 1; i <= unitCount; i++) {
        allUnitsToInsert.push({
            product_id: primary.id,
            unit_name: `#${i}`,
            status: 'Available'
        });
    }

    // Plan duplicate deletions
    plist.forEach(p => {
        if (p.id !== primary.id) allIdsToDelete.push(p.id);
    });
  }

  // 3. Perform Bulk Units Insert
  console.log(`Inserting ${allUnitsToInsert.length} units in bulk...`);
  const { error: uErr } = await supabase.from('product_units').insert(allUnitsToInsert);
  if (uErr) {
    console.error('Bulk insert units error:', uErr);
    return;
  }
  console.log('Successfully inserted all units.');

  // 4. Perform Bulk Deletions
  if (allIdsToDelete.length > 0) {
    console.log(`Deleting ${allIdsToDelete.length} duplicate products...`);
    const { error: dErr } = await supabase.from('products').delete().in('id', allIdsToDelete);
    if (dErr) console.error('Bulk delete products error:', dErr);
    else console.log('Successfully deleted duplicates.');
  }

  // 5. Final Rename Pass
  console.log('Renaming primary products if necessary...');
  for (const [baseName, plist] of Object.entries(groups)) {
    const primaryId = primaryIdMap[baseName];
    const currentPrimary = plist.find(p => p.id === primaryId);
    if (currentPrimary && currentPrimary.name !== baseName) {
        console.log(`  Renaming ${currentPrimary.name} -> ${baseName}`);
        await supabase.from('products').update({ name: baseName }).eq('id', primaryId);
    }
  }

  console.log('--- CONSOLIDATION COMPLETE ---');
}

migrate();
