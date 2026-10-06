const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // We are going to specifically target the exact broken string.
  // The string is:
  //     , { status: 401 });
  //     }
  
  content = content.replace(/    , \{ status: 401 \}\);\r?\n    \}\r?\n/g, '');
  content = content.replace(/    , \{ status: 401 \}\);\n    \}\n/g, '');
  content = content.replace(/,\s*\{\s*status:\s*401\s*\}\);\s*\n\s*\}/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed syntax in', filePath);
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
console.log('Done fix_syntax');
