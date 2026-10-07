const fs = require('fs');

function injectClean(filePath, modelName, getRules, mutateRules) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  if (!content.includes('import { requireAuth }')) {
    content = "import { requireAuth } from '@/lib/authorization';\nimport { logAudit } from '@/lib/audit';\n" + content;
  }

  if (getRules) {
    content = content.replace(/export async function GET\([^)]*\)\s*{\s*try\s*{/, (match) => {
      return match + `\n    const user = await requireAuth();\n${getRules}`;
    });
  }

  if (mutateRules) {
    content = content.replace(/export async function (PATCH|POST|PUT|DELETE)\([^)]*\)\s*{\s*try\s*{/g, (match) => {
      return match + `\n    const user = await requireAuth();\n${mutateRules}`;
    });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Secured clean', filePath);
}

// 1. Employee specific records (certifications, documents, skills)
const empRulesMutate = (model) => `
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'SUPERVISOR') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'employee');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Since multiple params are handled in different functions, resolve params.id
    const resourceId = await params.then(p => p.id);
    const targetResource = await prisma.${model}.findUnique({ where: { id: resourceId } });
    if (!targetResource) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });

    const authorizedEmployee = await prisma.employee.findFirst({
      where: { AND: [{ id: targetResource.employeeId }, scopedWhere] }
    });
    if (!authorizedEmployee) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });
`;

injectClean('e:\\Builder_mang\\apps\\web\\src\\app\\api\\certifications\\[id]\\route.ts', 'employeeCertification', null, empRulesMutate('employeeCertification'));
injectClean('e:\\Builder_mang\\apps\\web\\src\\app\\api\\documents\\[id]\\route.ts', 'employeeDocument', null, empRulesMutate('employeeDocument'));
injectClean('e:\\Builder_mang\\apps\\web\\src\\app\\api\\employee-skills\\[id]\\route.ts', 'employeeSkill', null, empRulesMutate('employeeSkill'));

// 2. Workforce Projects
const wpPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\projects\\[projectId]\\route.ts';
const wpRulesGet = `
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const { projectId } = await params;
    const authorizedVenture = await prisma.venture.findFirst({ where: { AND: [{ id: projectId }, scopedWhere] } });
    if (!authorizedVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });
`;
injectClean(wpPath, null, wpRulesGet, null);

// 3. Workforce Sites
const wsPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\sites\\[siteId]\\route.ts';
const wsRulesGet = `
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const { siteId } = await params;
    const authorizedVenture = await prisma.venture.findFirst({ where: { AND: [{ id: siteId }, scopedWhere] } });
    if (!authorizedVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });
`;
injectClean(wsPath, null, wsRulesGet, null);

// Workforce generic
const wPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\route.ts';
const wRulesGet = `
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'SUPERVISOR') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
`;
injectClean(wPath, null, wRulesGet, wRulesGet);

console.log('Clean IDOR injection complete');
