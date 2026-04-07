const fs = require('fs');
const filePath = 'c:/Users/thait/Desktop/ChinHaStore_Offical/src/services/adminService.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = /return created\.id;\s*\},,/;
if (content.match(target)) {
    content = content.replace(target, 'return created.id;\n  },');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: Double comma removed.');
} else {
    // Try without space
    const target2 = /return created\.id;\} ,/;
    console.log('FAILURE: Target pattern not found. Check line 301 manually.');
}
