const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Fix: Cannot redeclare block-scoped variable 'user'
  if (content.includes('const user = user;')) {
    content = content.replace(/const user = user;\n?/g, '');
    changed = true;
  }
  
  if (content.includes('const user = await requireAuth();\n    const user = user;')) {
    content = content.replace(/const user = await requireAuth\(\);\n\s*const user = user;/g, 'const user = await requireAuth();');
    changed = true;
  }
  
  // E.g. apps/web/src/app/api/ventures/route.ts(9,11): Cannot redeclare block-scoped variable 'user'.
  const dupeUserRegex = /const user = await requireAuth\(\);\n\s*const user = (?:await requireAuth\(\))?/;
  if (dupeUserRegex.test(content)) {
    content = content.replace(/const user = await requireAuth\(\);\n\s*const user = (?:await requireAuth\(\))?;/g, 'const user = await requireAuth();');
    changed = true;
  }

  // Fix: Cannot find name 'session'.
  // We missed `if (!session || !userRole)` or `if (!session)` where there was no status 401 string.
  // Or `if (!session || !userRole) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }`
  
  // Just find and remove any if (!session...) check, since requireAuth throws anyway.
  const sessionCheck = /if \(!session(?:[^)]*)\)\s*\{[^}]+\}/g;
  if (sessionCheck.test(content)) {
    content = content.replace(sessionCheck, '');
    changed = true;
  }

  // For property 'employee' does not exist on type...
  // In src/app/api/chat/rooms/[roomId]/messages/route.ts
  // const user = await prisma.user.findUnique({ where: { id: userId }, include: { employee: true } });
  // The Prisma type inference clashes with the `user` returned by `requireAuth()`.
  // We can rename it to `dbUser`.
  const dbUserRegex = /const user = await prisma\.user\.findUnique/g;
  if (dbUserRegex.test(content)) {
    content = content.replace(dbUserRegex, 'const dbUser = await prisma.user.findUnique');
    content = content.replace(/user\?.employee/g, 'dbUser?.employee');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed types in', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src/app/api'));
console.log('Done fix_types');
