const fs = require('fs');
const path = require('path');
const { ROUTE_METADATA } = require('./apps/web/src/lib/navigation.ts');

function walk(dir, res = []) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, res);
    else if (file === 'page.tsx') res.push(p);
  });
  return res;
}

const pages = walk('apps/web/src/app/(dashboard)');
let failed = false;

for (const page of pages) {
  let routePath = page.replace(/^apps[\\/]web[\\/]src[\\/]app[\\/]\(dashboard\)/, '').replace(/[\\/]page\.tsx$/, '').replace(/\\/g, '/');
  if (routePath === '') routePath = '/dashboard'; 
  
  const testPath = routePath.replace(/\[([^\]]+)\]/g, '12345');
  
  let found = false;
  for (const meta of ROUTE_METADATA) {
    if (meta.pattern.test(testPath)) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.error(`❌ No metadata found for route: ${routePath} (tested as ${testPath})`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('✅ All routes have metadata!');
}
