const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetExts = ['.ts', '.tsx', '.prisma'];

walkDir('e:\\Builder_mang\\apps\\web\\src', (filePath) => {
  if (targetExts.some(ext => filePath.endsWith(ext))) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    // Replace PROJECT_MANAGER -> MANAGER
    // Need to be careful with exact word match
    content = content.replace(/\bPROJECT_MANAGER\b/g, 'MANAGER');
    content = content.replace(/\bSITE_ENGINEER\b/g, 'SUPERVISOR');
    
    // Update ALLOWED_ROLES if present
    content = content.replace(/const ALLOWED_ROLES = \[.*?\];/g, (match) => {
      let c = match.replace(/['"]PROJECT_MANAGER['"]/g, "'MANAGER'");
      c = c.replace(/['"]SITE_ENGINEER['"]/g, "'SUPERVISOR'");
      // Deduplicate array values
      let arr = c.substring(c.indexOf('[')+1, c.indexOf(']')).split(',').map(s=>s.trim()).filter(s=>s);
      let uniqueArr = [...new Set(arr)];
      return `const ALLOWED_ROLES = [${uniqueArr.join(', ')}];`;
    });

    if (content !== original) {
      console.log('Updated', filePath);
      fs.writeFileSync(filePath, content, 'utf-8');
    }
  }
});
