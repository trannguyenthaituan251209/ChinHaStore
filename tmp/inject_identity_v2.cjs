const fs = require('fs');
const filePath = 'c:/Users/thait/Desktop/ChinHaStore_Offical/src/services/adminService.js';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `  async getOrCreateCustomer(customerData) {
    const { phone, full_name, email, city, social } = customerData;
    const cleanPhone = phone?.trim() || '0';
    const cleanName = full_name?.trim() || 'Khách lẻ';

    // 1. SEARCH FOR EXACT IDENTITY (NAME + PHONE)
    // This supports multi-identity scenarios (borrowed SIMs, etc.)
    const { data: exactMatch } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('phone', cleanPhone)
      .ilike('full_name', cleanName)
      .maybeSingle();

    if (exactMatch) {
       // Optional: Update email/city if they are new
       if (email || city || social) {
         await supabase.from('customers').update({
           email: email || '',
           city: city || 'Hồ Chí Minh',
           social: social || '',
           updated_at: new Date().toISOString()
         }).eq('id', exactMatch.id);
       }
       return exactMatch.id;
    }

    // 2. CREATE NEW IDENTITY
    // Even if phone exists for another name, we create a new distinct record
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

const match = content.match(/async getOrCreateCustomer\(customerData\) \{[\s\S]*?return created\.id;[\s\n\r]*\},/);
if (match) {
    content = content.replace(match[0], replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: Name+Phone identity logic injected.');
} else {
    // Try without trailing comma
    const matchAlt = content.match(/async getOrCreateCustomer\(customerData\) \{[\s\S]*?return created\.id;[\s\n\r]*\}/);
    if (matchAlt) {
       content = content.replace(matchAlt[0], replacement);
       fs.writeFileSync(filePath, content, 'utf8');
        console.log('SUCCESS: Name+Phone identity logic injected (Alternative).');
    } else {
       console.log('FAILURE: getOrCreateCustomer function not found.');
    }
}
