const fs = require('fs');

function applyAudit(filePath, actionStr) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // We want to insert the logAudit before `return NextResponse.json({ success: true`
  const returnRegex = /return NextResponse\.json\(\{\s*success:\s*true/g;
  
  if (!content.includes('logAudit(')) {
    content = content.replace(returnRegex, (match) => {
      return `await logAudit((user as any).id, '${actionStr}', 'Action completed successfully', null);\n    ${match}`;
    });
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Added audit to', filePath);
  }
}

applyAudit('e:\\Builder_mang\\apps\\web\\src\\app\\api\\onboarding\\route.ts', 'CREATE_ONBOARDING_CANDIDATE');
applyAudit('e:\\Builder_mang\\apps\\web\\src\\app\\api\\onboarding\\[employeeId]\\route.ts', 'UPDATE_ONBOARDING_CANDIDATE');
applyAudit('e:\\Builder_mang\\apps\\web\\src\\app\\api\\assignments\\[id]\\route.ts', 'MODIFY_ASSIGNMENT');
applyAudit('e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\settings\\route.ts', 'UPDATE_VENTURE_SETTINGS');
applyAudit('e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\documents\\route.ts', 'MANAGE_VENTURE_DOCUMENT');
applyAudit('e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\announcements\\route.ts', 'MANAGE_VENTURE_ANNOUNCEMENT');
