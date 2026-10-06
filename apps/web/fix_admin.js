const fs = require('fs');

const route = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\admin\\users\\route.ts';
let content = fs.readFileSync(route, 'utf-8');

content = content.replace(/const newUser = await prisma\.user\.create\(\{const newUser = await prisma\.user\.create\(\{([\s\S]*?)\}\);\}\);/, 'const newUser = await prisma.user.create({$1});');

fs.writeFileSync(route, content, 'utf-8');
console.log('Fixed syntax in admin users');
