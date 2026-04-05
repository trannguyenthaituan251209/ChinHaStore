const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Constants from .env
const SUPABASE_URL = 'https://jlxccojxwrfgtowyhhjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  const content = fs.readFileSync('cameradatabase.md', 'utf8');
  const lines = content.split('\n');

  const cameras = [];
  let currentCamera = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Detect Name (supports --Name-- or -Name-- etc)
    const nameMatch = line.match(/-+([^-].+?)-+/);
    if (nameMatch) {
      if (currentCamera) cameras.push(currentCamera);
      currentCamera = {
        id: crypto.randomUUID(),
        name: nameMatch[1].trim(),
        price_6h: '0',
        price_1day: '0',
        price_2days: '0',
        price_3days: '0',
        price_4days_plus: '0',
        category: 'Mirrorless', // Default
        image_url: '',
      };
      
      // Auto-category logical overrides
      if (currentCamera.name.includes('Canon G7x') || currentCamera.name.includes('Ricoh')) {
        currentCamera.category = 'Compact';
      } else if (currentCamera.name.includes('Pocket')) {
        currentCamera.category = 'Action';
      }
      
      continue;
    }

    if (!currentCamera) continue;

    // Parse Prices (Remove all non-numeric chars like . and VND)
    const cleanPrice = (str) => str.replace(/[^0-9]/g, '');

    if (line.includes('6 hours:')) {
      currentCamera.price_6h = cleanPrice(line.split(':')[1]);
    } else if (line.includes('1 day :') || line.includes('1 day:')) {
      currentCamera.price_1day = cleanPrice(line.split(':')[1]);
    } else if (line.includes('2 days :') || line.includes('2 days:')) {
      currentCamera.price_2days = cleanPrice(line.split(':')[1]);
    } else if (line.includes('3 days:')) {
      currentCamera.price_3days = cleanPrice(line.split(':')[1]);
    } else if (line.includes('From day 4')) {
      currentCamera.price_4days_plus = cleanPrice(line.split(':')[1]);
    }
  }
  
  if (currentCamera) cameras.push(currentCamera);

  console.log(`Parsed ${cameras.length} cameras. Inserting into Supabase...`);

  const { data, error } = await supabase
    .from('products')
    .insert(cameras);

  if (error) {
    console.error('Error seeding data:', error);
  } else {
    console.log('Seeding successful!');
  }
}

seed();
