const fs = require('fs');
const path = require('path');

const fileMap = {
  'e:/Builder_mang/apps/web/src/app/api/workforce/route.ts': 'employees:view',
  'e:/Builder_mang/apps/web/src/app/api/ventures/route.ts': 'ventures:create', // POST
  'e:/Builder_mang/apps/web/src/app/api/ventures/[ventureId]/announcements/route.ts': 'ventures:edit',
  'e:/Builder_mang/apps/web/src/app/api/ventures/[ventureId]/route.ts': 'ventures:edit',
  'e:/Builder_mang/apps/web/src/app/api/ventures/[ventureId]/settings/route.ts': 'ventures:edit',
  'e:/Builder_mang/apps/web/src/app/api/ventures/[ventureId]/members/route.ts': 'ventures:edit',
  'e:/Builder_mang/apps/web/src/app/api/ventures/[ventureId]/materials/route.ts': 'materials:stock', // Need to check if ADMIN only
  'e:/Builder_mang/apps/web/src/app/api/ventures/[ventureId]/documents/route.ts': 'documents:edit',
  'e:/Builder_mang/apps/web/src/app/api/ventures/[ventureId]/archive/route.ts': 'ventures:archive',
  'e:/Builder_mang/apps/web/src/app/api/onboarding/[employeeId]/route.ts': 'employees:edit',
  'e:/Builder_mang/apps/web/src/app/api/materials/route.ts': 'materials:view', // Need to check POST
  'e:/Builder_mang/apps/web/src/app/api/onboarding/route.ts': 'employees:view',
  'e:/Builder_mang/apps/web/src/app/api/employees/[id]/assignments/route.ts': 'employees:assign',
  'e:/Builder_mang/apps/web/src/app/api/employees/[id]/route.ts': 'employees:edit',
  'e:/Builder_mang/apps/web/src/app/api/employees/[id]/skills/route.ts': 'skills:edit',
  'e:/Builder_mang/apps/web/src/app/api/employees/[id]/documents/route.ts': 'documents:edit',
  'e:/Builder_mang/apps/web/src/app/api/employees/[id]/certifications/route.ts': 'certifications:edit',
  'e:/Builder_mang/apps/web/src/app/api/documents/[id]/route.ts': 'documents:edit',
  'e:/Builder_mang/apps/web/src/app/api/employee-skills/[id]/route.ts': 'skills:edit',
  'e:/Builder_mang/apps/web/src/app/api/chat/rooms/[roomId]/members/route.ts': 'chat:manage',
  'e:/Builder_mang/apps/web/src/app/api/certifications/[id]/route.ts': 'certifications:edit',
  'e:/Builder_mang/apps/web/src/app/api/chat/rooms/[roomId]/messages/route.ts': 'chat:manage',
  'e:/Builder_mang/apps/web/src/app/api/chat/rooms/route.ts': 'chat:manage',
  'e:/Builder_mang/apps/web/src/app/api/assignments/[id]/route.ts': 'employees:assign',
};

for (const [p, perm] of Object.entries(fileMap)) {
  const norm = path.normalize(p);
  if (!fs.existsSync(norm)) continue;
  let c = fs.readFileSync(norm, 'utf8');

  // Inject import
  if (!c.includes("import { hasPermission } from '@/lib/permissions'")) {
    c = c.replace(/import \{ NextResponse \} from 'next\/server';/, "import { NextResponse } from 'next/server';\nimport { hasPermission } from '@/lib/permissions';");
  }
  if (!c.includes("import { hasPermission }")) {
      // fallback
      c = "import { hasPermission } from '@/lib/permissions';\n" + c;
  }

  // Replace condition
  // Some files use !session || (userRole !== 'ADMIN' && userRole !== 'MANAGER')
  c = c.replace(/if \(!session \|\| \(userRole !== 'ADMIN'.*?\)\) \{/, `if (!session || (userRole !== 'ADMIN' && !hasPermission(userRole, '${perm}'))) {`);
  
  // Normal userRole !== 'ADMIN' && ...
  c = c.replace(/if \(userRole !== 'ADMIN'.*?\) \{/g, `if (userRole !== 'ADMIN' && !hasPermission(userRole, '${perm}')) {`);
  
  // chat/rooms/route.ts has "} else if (userRole !== 'ADMIN') {"
  c = c.replace(/\} else if \(userRole !== 'ADMIN'\) \{/g, `} else if (userRole !== 'ADMIN' && !hasPermission(userRole, '${perm}')) {`);

  // chat/rooms/route.ts has "if (ventureId && userRole !== 'ADMIN') {"
  c = c.replace(/if \(ventureId && userRole !== 'ADMIN'\) \{/g, `if (ventureId && userRole !== 'ADMIN' && !hasPermission(userRole, '${perm}')) {`);

  fs.writeFileSync(norm, c, 'utf8');
  console.log('Migrated', norm);
}
