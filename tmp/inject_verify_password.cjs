const fs = require('fs');
const filePath = 'c:/Users/thait/Desktop/ChinHaStore_Offical/src/services/adminService.js';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `  /**
   * RE-AUTHENTICATION HANDSHAKE:
   * Verification step before high-risk actions (e.g. Deletion).
   */
  async verifyPassword(password) {
    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr || !user) throw new Error('Không thể xác minh phiên làm việc.');

    const { error: pErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    
    if (pErr) throw new Error('Mật khẩu quản trị không chính xác.');
    return true;
  },

  /**
   * Specialized Sign Out to clear session persistence
   */`;

const target = /  \/\*\*[\s\n\r]*\* Specialized Sign Out to clear session persistence[\s\n\r]*\*\//;
if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: verifyPassword logic injected.');
} else {
    console.log('FAILURE: SignOut target not found.');
}
