const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jlxccojxwrfgtowyhhjk.supabase.co', 'sb_publishable_TxBd8i0X3PDMUl4754M4kQ_8mplqrJy');

// Simulating adminService.getOrCreateCustomer logic
async function getOrCreateCustomer(customerData) {
    const { phone, full_name } = customerData;
    const cleanPhone = phone?.trim() || '0';
    const cleanName = full_name?.trim() || 'Khách lẻ';

    const { data: exactMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .ilike('full_name', cleanName)
      .maybeSingle();

    if (exactMatch) return exactMatch.id;

    const { data: created, error } = await supabase
      .from('customers')
      .insert({ phone: cleanPhone, full_name: cleanName, status: 'active' })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
}

async function verify() {
  console.log('Testing Shared Phone Identity...');
  const phone = '9999999999';
  
  const id1 = await getOrCreateCustomer({ phone, full_name: 'Verification Alpha' });
  const id2 = await getOrCreateCustomer({ phone, full_name: 'Verification Beta' });
  
  console.log('ID 1:', id1);
  console.log('ID 2:', id2);
  
  if (id1 !== id2) {
    console.log('SUCCESS: Alpha and Beta are different identities despite sharing phone 9999999999.');
  } else {
    console.log('FAILURE: Alpha and Beta were merged!');
  }

  // Cleanup
  await supabase.from('customers').delete().in('id', [id1, id2]);
}

verify();
