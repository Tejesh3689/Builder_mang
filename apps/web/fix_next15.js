const fs = require('fs');

function findFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(dir + '/' + file);
    if (stat.isDirectory()) {
      findFiles(dir + '/' + file, ext, fileList);
    } else if (file.endsWith(ext)) {
      fileList.push(dir + '/' + file);
    }
  }
  return fileList;
}

const apiFiles = findFiles('e:/Builder_mang/apps/web/src/app/api', '.ts');

for (const file of apiFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (content.includes('params }: { params: { id: string } }')) {
    content = content.replace(/params }: { params: { id: string } }/g, 'params }: { params: any }');
    changed = true;
  }
  if (content.includes('params }: { params: { id: string, attachmentId: string } }')) {
    content = content.replace(/params }: { params: { id: string, attachmentId: string } }/g, 'params }: { params: any }');
    changed = true;
  }
  if (changed) fs.writeFileSync(file, content);
}

console.log('Fixed Next.js 15 routing types');
