const fs = require('fs');

const requestsPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\requests\\[id]\\route.ts';
if (fs.existsSync(requestsPath)) {
  let content = fs.readFileSync(requestsPath, 'utf8');
  content = content.replace(
    /if \(userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'STORE_MANAGER'\) {/,
    `const { hasPermission } = await import('@/lib/permissions');
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'materials:approve')) {`
  );
  fs.writeFileSync(requestsPath, content, 'utf8');
  console.log('Fixed requests approval roles');
}

const issuePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\issue\\route.ts';
if (fs.existsSync(issuePath)) {
  let content = fs.readFileSync(issuePath, 'utf8');
  content = content.replace(
    /if \(userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'STORE_MANAGER'\) {/,
    `const { hasPermission } = await import('@/lib/permissions');
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'materials:issue')) {`
  );
  fs.writeFileSync(issuePath, content, 'utf8');
  console.log('Fixed material issue roles');
}
