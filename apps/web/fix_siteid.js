const fs = require('fs');
let p = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\sites\\[siteId]\\route.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/const \{ siteId \} = await params;\n\s*\/\/ For site allocations/g, '// For site allocations');
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed siteId');
