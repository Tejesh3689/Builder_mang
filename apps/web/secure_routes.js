const fs = require('fs');

function injectAuth(filePath, getRules, patchRules, deleteRules) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('requireAuth()')) return; // skip if already secured

  content = content.replace(/(import .* from '.*?';\n)/, "$1import { requireAuth } from '@/lib/authorization';\nimport { logAudit } from '@/lib/audit';\n");

  if (getRules) {
    content = content.replace(/export async function GET\([^)]*\)\s*{\s*try\s*{/, (match) => {
      return match + `\n    const user = await requireAuth();\n${getRules}`;
    });
  }

  if (patchRules) {
    content = content.replace(/export async function (PATCH|POST|PUT)\([^)]*\)\s*{\s*try\s*{/g, (match) => {
      return match + `\n    const user = await requireAuth();\n${patchRules}`;
    });
  }

  if (deleteRules) {
    content = content.replace(/export async function DELETE\([^)]*\)\s*{\s*try\s*{/g, (match) => {
      return match + `\n    const user = await requireAuth();\n${deleteRules}`;
    });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Secured', filePath);
}

// 1. Assignments
const assignRules = `
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const existing = await prisma.employeeVentureAssignment.findUnique({ where: { id: await params.then(p => p.id) } });
    if (!existing) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
    
    const hasVentureAccess = await prisma.venture.findFirst({ where: { AND: [{ id: existing.ventureId }, scopedWhere] } });
    if (!hasVentureAccess) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });
`;
injectAuth('e:\\Builder_mang\\apps\\web\\src\\app\\api\\assignments\\[id]\\route.ts', null, assignRules, assignRules);

// 2. Venture Activities/Announcements/Docs/Settings
const ventureRulesGet = `
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const ventureId = await params.then(p => p.ventureId);
    const existingVenture = await prisma.venture.findFirst({ where: { AND: [{ id: ventureId }, scopedWhere] } });
    if (!existingVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });
`;
const ventureRulesMutate = `
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
` + ventureRulesGet;

['activity','announcements','documents','settings'].forEach(folder => {
  injectAuth('e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\' + folder + '\\route.ts', ventureRulesGet, ventureRulesMutate, ventureRulesMutate);
});

// 3. Employee specific records (certifications, documents, skills)
const empRulesMutate = `
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
`;
['certifications','documents','employee-skills'].forEach(folder => {
  injectAuth('e:\\Builder_mang\\apps\\web\\src\\app\\api\\' + folder + '\\[id]\\route.ts', null, empRulesMutate, empRulesMutate);
});

// 4. Onboarding / Workforce
['onboarding', 'onboarding\\[employeeId]', 'workforce', 'workforce\\projects\\[projectId]', 'workforce\\sites\\[siteId]'].forEach(route => {
  injectAuth('e:\\Builder_mang\\apps\\web\\src\\app\\api\\' + route + '\\route.ts', null, empRulesMutate, empRulesMutate);
});
