const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function migrate() {
  console.log('Fetching bookings...');
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, start_time')
    .is('booking_id', null);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${bookings.length} bookings without ID.`);

  for (const b of bookings) {
    const d = new Date(b.start_time);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const random = Math.floor(Math.random() * 900) + 100;
    const bid = `${day}${month}${year}${random}`;

    console.log(`Updating ${b.id} -> ${bid}`);
    const { error: uErr } = await supabase
      .from('bookings')
      .update({ booking_id: bid })
      .eq('id', b.id);

    if (uErr) console.error(`Error updating ${b.id}:`, uErr.message);
  }

  console.log('Migration complete!');
}

migrate();
