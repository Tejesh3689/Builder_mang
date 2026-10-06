const fs = require('fs');

function injectIdor(filePath, modelName) {
  let content = fs.readFileSync(filePath, 'utf-8');

  const patchCheck = `
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'SUPERVISOR') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'employee');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const resourceId = await params.then(p => p.id);
    const targetResource = await prisma.${modelName}.findUnique({ where: { id: resourceId } });
    if (!targetResource) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });

    const authorizedEmployee = await prisma.employee.findFirst({
      where: { AND: [{ id: targetResource.employeeId }, scopedWhere] }
    });
    if (!authorizedEmployee) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });
`;

  // Insert before `const { id } = await params;` or `const body = await req.json();`
  content = content.replace(/const userRole = \(user as any\)\.role;\s*if \(userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'SUPERVISOR'\) \{\s*return NextResponse\.json\(\{ success: false, error: 'Forbidden' \}, \{ status: 403 \}\);\s*\}/g, patchCheck);

  fs.writeFileSync(filePath, content, 'utf-8');
}

injectIdor('e:\\Builder_mang\\apps\\web\\src\\app\\api\\certifications\\[id]\\route.ts', 'employeeCertification');
injectIdor('e:\\Builder_mang\\apps\\web\\src\\app\\api\\documents\\[id]\\route.ts', 'employeeDocument');
injectIdor('e:\\Builder_mang\\apps\\web\\src\\app\\api\\employee-skills\\[id]\\route.ts', 'employeeSkill');

// For workforce/projects
const wpPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\projects\\[projectId]\\route.ts';
let wpContent = fs.readFileSync(wpPath, 'utf-8');
wpContent = wpContent.replace(/const \{ siteId \} = await params;/g, '');
wpContent = wpContent.replace(/const \{ projectId \} = await params;/g, '');
// Since we have multiple re-declarations from secure_routes_2.js, I will just checkout workforce
fs.writeFileSync(wpPath, wpContent, 'utf-8');

// For workforce/sites
const wsPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\sites\\[siteId]\\route.ts';
let wsContent = fs.readFileSync(wsPath, 'utf-8');
wsContent = wsContent.replace(/const \{ siteId \} = await params;/g, '');
fs.writeFileSync(wsPath, wsContent, 'utf-8');

console.log('Fixed IDOR 2');
