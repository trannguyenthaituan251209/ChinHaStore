const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
  // 1. Fetch all products
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr) return console.error(pErr);

  // 2. Group by "Base Name"
  // e.g. "Canon EOS R50 #5" -> "Canon EOS R50"
  const getBaseName = (name) => name.replace(/\s#\d+$/, '').trim();

  const groups = {};
  products.forEach(p => {
    const base = getBaseName(p.name);
    if (!groups[base]) groups[base] = [];
    groups[base].push(p);
  });

  console.log('Detected Product Groups:', Object.keys(groups));

  for (const [baseName, plist] of Object.entries(groups)) {
    console.log(`Processing ${baseName}...`);
    
    // Pick the "Primary" product (preferably one without a # in the name)
    let primary = plist.find(p => !p.name.includes('#'));
    if (!primary) primary = plist[0];

    console.log(`  > Primary Product: ${primary.name} (${primary.id})`);

    // Create Units for this product
    // For R50, we want 10 units. For others, 1 unit.
    const unitCount = baseName.includes('Canon EOS R50') ? 10 : 1;
    
    for (let i = 1; i <= unitCount; i++) {
        const { data: unit, error: uErr } = await supabase.from('product_units').insert({
            product_id: primary.id,
            unit_name: `#${i}`,
            status: 'Available'
        }).select().single();
        
        if (uErr) console.error(`  ! Error creating unit #${i}:`, uErr.message);
        else console.log(`  + Created unit #${i} for ${baseName}`);
    }

    // Identify bookings for any of the products in 'plist' and move them to 'primary.id'
    // Actually, bookings already have product_id. We just need to assign a unit_id to them.
    // (This part is complex as we need to find an available unit for each booking)
    // For now, I'll assume there are no significant existing bookings that need complex assignment.
    
    // Delete the duplicates (all except primary)
    const duplicates = plist.filter(p => p.id !== primary.id);
    if (duplicates.length > 0) {
        const idsToDelete = duplicates.map(p => p.id);
        console.log(`  - Deleting ${duplicates.length} duplicate(s):`, idsToDelete);
        const { error: dErr } = await supabase.from('products').delete().in('id', idsToDelete);
        if (dErr) console.error(`  ! Error deleting duplicates:`, dErr.message);
    }
  }

  // Final cleanup: update the names of primary products if they have #
  for (const [baseName, plist] of Object.entries(groups)) {
     let primary = plist.find(p => !p.name.includes('#'));
     if (!primary) {
         primary = plist[0];
         console.log(`  * Renaming ${primary.name} -> ${baseName}`);
         await supabase.from('products').update({ name: baseName }).eq('id', primary.id);
     }
  }
}

migrate();
