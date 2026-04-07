const fs = require('fs');
const filePath = 'c:/Users/thait/Desktop/ChinHaStore_Offical/src/services/adminService.js';
let lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

// Look for lines 101-102
if (lines[100].trim() === '},' && lines[101].trim() === '},') {
    lines.splice(101, 1);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('SUCCESS: Line 102 (rogue brace) removed.');
} else {
    console.log('FAILURE: Unexpected line content at 101/102.');
    console.log('L100:', lines[99]);
    console.log('L101:', lines[100]);
    console.log('L102:', lines[101]);
}
