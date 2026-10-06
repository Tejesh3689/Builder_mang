const fs = require('fs');
const path = require('path');

// Target routes:
// apps/web/src/app/api/admin/users/route.ts (user creation)
// apps/web/src/app/api/ventures/route.ts (venture creation)
// apps/web/src/app/api/ventures/[ventureId]/archive/route.ts (venture archive)
// apps/web/src/app/api/materials/route.ts (material creation)
// apps/web/src/app/api/materials/issue/route.ts (material issue)
// apps/web/src/app/api/materials/requests/[id]/route.ts (material approval)
// apps/web/src/app/api/leaves/[id]/route.ts (leave approval)

function injectAudit(filePath, replaceRegex, replacement) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes('import { logAudit }')) {
    content = content.replace(/(import .* from '.*?';\n)/, "$1import { logAudit } from '@/lib/audit';\n");
  }
  content = content.replace(replaceRegex, replacement);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Injected audit into', filePath);
}

// 1. User Creation
injectAudit(
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\admin\\users\\route.ts',
  /const newUser = await prisma\.user\.create\(\{[\s\S]*?\}\);/,
  "const newUser = await prisma.user.create({$&});\n    await logAudit((user as any).id, 'CREATE_USER', `Created user ${newUser.email} with role ${assignedRole}`);"
);

// 2. Venture Creation
injectAudit(
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\route.ts',
  /return NextResponse\.json\(\{ success: true, data: venture \}, \{ status: 201 \}\);/,
  "await logAudit((user as any).id, 'CREATE_VENTURE', `Created venture ${name}`, venture.id);\n      return NextResponse.json({ success: true, data: venture }, { status: 201 });"
);

// 3. Venture Archive
injectAudit(
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\archive\\route.ts',
  /return NextResponse\.json\(\{ success: true, data: updated \}\);/,
  "await logAudit((user as any).id, 'ARCHIVE_VENTURE', `Archived venture ${ventureId}`, ventureId);\n      return NextResponse.json({ success: true, data: updated });"
);

// 4. Material Creation
injectAudit(
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\route.ts',
  /return NextResponse\.json\(\{ success: true, data: material \}, \{ status: 201 \}\);/,
  "await logAudit((user as any).id, 'CREATE_MATERIAL', `Created material ${name} (${code})`);\n    return NextResponse.json({ success: true, data: material }, { status: 201 });"
);

// 5. Material Issue
injectAudit(
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\issue\\route.ts',
  /return NextResponse\.json\(\{ success: true, data: result \}\);/,
  "await logAudit((user as any).id, 'ISSUE_MATERIAL', `Issued materials under issue ${issueNumber}`, ventureId);\n    return NextResponse.json({ success: true, data: result });"
);

// 6. Material Approval
injectAudit(
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\requests\\[id]\\route.ts',
  /return NextResponse\.json\(\{ success: true, data: updated \}\);/,
  "await logAudit((user as any).id, 'APPROVE_MATERIAL_REQUEST', `Approved/Rejected material request ${requestId}`, updated.ventureId);\n      return NextResponse.json({ success: true, data: updated });"
);

// 7. Leave Approval
injectAudit(
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\leaves\\[id]\\route.ts',
  /return NextResponse\.json\(\{ success: true, data: updated \}\);/,
  "await logAudit((user as any).id, 'APPROVE_LEAVE', `Approved/Rejected leave ${leaveId}`);\n      return NextResponse.json({ success: true, data: updated });"
);

console.log('Done injecting audit');
