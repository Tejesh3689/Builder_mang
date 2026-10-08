const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/prisma/migrations/20261008_decimal_precision/migration.sql');
let content = fs.readFileSync(file, 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
fs.writeFileSync(file, content, 'utf8');
console.log('Removed BOM');
