const fs = require('fs');
const filePath = 'c:/Users/thait/Desktop/ChinHaStore_Offical/src/services/adminService.js';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `  async getOrCreateCustomer(customerData) {
    const { phone, full_name, email, city, social } = customerData;
    const cleanPhone = phone?.trim() || '0';
    const cleanName = full_name?.trim() || 'Khách lẻ';

    // 1. Check for exact match (Phone + Name)
    const { data: exactMatch } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .ilike('full_name', cleanName)
      .maybeSingle();

    if (exactMatch) return exactMatch.id;

    // 2. Check for phone-only match
    const isPlaceholder = cleanPhone === '0' || cleanPhone.toLowerCase() === 'none' || cleanPhone.length < 5;

    if (!isPlaceholder) {
      const { data: phoneMatch } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (phoneMatch) {
         // CRITICAL FIX: Update the name for this phone record!
         await supabase.from('customers').update({
           full_name: cleanName,
           email: email || '',
           city: city || 'Hồ Chí Minh',
           social: social || '',
           updated_at: new Date().toISOString()
         }).eq('id', phoneMatch.id);
         
         return phoneMatch.id;
      }
    }

    // 3. Create new if neither match exists
    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        phone: cleanPhone,
        full_name: cleanName,
        email: email || '',
        city: city || 'Hồ Chí Minh',
        social: social || '',
        status: 'active'
      })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
  },`;

const match = content.match(/async getOrCreateCustomer\(customerData\) \{[\s\S]*?return created\.id;[\s\n\r]*\}/);

if (match) {
    content = content.replace(match[0], replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: Name-update logic injected.');
} else {
    // Try with a slightly larger pattern if the first one failed
    const matchAlt = content.match(/async getOrCreateCustomer\(customerData\) \{[\s\S]*?return created\.id;[\s\n\r]*\},/);
    if (matchAlt) {
       content = content.replace(matchAlt[0], replacement);
       fs.writeFileSync(filePath, content, 'utf8');
       console.log('SUCCESS: Name-update logic injected (Alternative).');
    } else {
       console.log('FAILURE: getOrCreateCustomer function not found.');
    }
}
