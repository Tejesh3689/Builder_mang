const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/api/materials/issue/route.ts');
let content = fs.readFileSync(file, 'utf8');
content = content.replace('}\\n      return newIssue;', '}\n      return newIssue;');
fs.writeFileSync(file, content);
console.log('Fixed syntax error completely');
