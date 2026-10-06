const fs = require('fs');
const filePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\chat\\rooms\\[roomId]\\messages\\route.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix syntax on line 90-93
content = content.replace(/if \(!senderId\) {\r?\n      return NextResponse\.json\(\{ success: false, error: 'Unauthorized' \}\r?\n\r?\n    if \(userRole !== 'ADMIN'\) {/, "if (!senderId) {\n      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });\n    }\n\n    if (userRole !== 'ADMIN') {");

// Fix dbUser.employee TS errors
content = content.replace(/user\.employee/g, 'dbUser.employee');
// Revert the ones that shouldn't be dbUser (on line 26 it's dbUser anyway because we named it dbUser)

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed', filePath);
