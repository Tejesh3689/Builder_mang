const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (content.includes('dbUser.employee')) {
    content = content.replace(/dbUser\.employee/g, 'dbUser?.employee');
    changed = true;
  }
  
  if (content.includes('!session')) {
    content = content.replace(/!session/g, '!user');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed nulls in', filePath);
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
console.log('Done fix_nulls');
