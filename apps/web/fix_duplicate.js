const fs = require('fs');
let p = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\projects\\[projectId]\\route.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/const \{ projectId \} = await params;\s*const allocations/g, 'const allocations');
fs.writeFileSync(p, c, 'utf8');

p = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\sites\\[siteId]\\route.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/const \{ siteId \} = await params;\s*const siteAllocations/g, 'const siteAllocations');
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed duplicates');
