const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (content.includes('getServerSession(authOptions)')) {
    // 1. Add requireAuth import if not present
    if (!content.includes('import { requireAuth }')) {
      content = content.replace(/(import .* from 'next\/server';)/, "$1\nimport { requireAuth } from '@/lib/authorization';");
    }

    // 2. Remove old imports
    content = content.replace(/import { getServerSession } from 'next-auth';\n/g, '');
    content = content.replace(/import { authOptions } from '@\/lib\/auth';\n/g, '');
    
    // 3. Replace session fetch
    content = content.replace(/const session = await getServerSession\(authOptions\);/g, 'const user = await requireAuth();');

    // 4. Safely replace variables
    content = content.replace(/const userId = \(session\?.user as any\)\?.id;/g, 'const userId = (user as any).id;');
    content = content.replace(/const userRole = \(session\?.user as any\)\?.role;/g, 'const userRole = (user as any).role;');
    content = content.replace(/const userId = session\?.user\?.id;/g, 'const userId = (user as any).id;');
    content = content.replace(/const userRole = session\?.user\?.role;/g, 'const userRole = (user as any).role;');
    content = content.replace(/session\?.user/g, 'user');
    content = content.replace(/session\.user/g, 'user');

    // 5. Replace session checks. We can safely replace the exact pattern:
    // if (!session || !userId) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }
    const authCheckPattern = /if \(!session(?: \|\| !userId)?\) \{\s*return NextResponse\.json\(\{ (?:success: false, )?error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\}/g;
    content = content.replace(authCheckPattern, '');

    const authCheckPattern2 = /if \(!session\) \{\s*return NextResponse\.json\(\{ (?:success: false, )?error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\}/g;
    content = content.replace(authCheckPattern2, '');

    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Processed', filePath);
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
console.log('Done replacement');
