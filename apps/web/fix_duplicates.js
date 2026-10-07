const fs = require('fs');

function removeDuplicate(filePath, varName) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const regex = new RegExp(`const { ${varName} } = await params;\n\\s*// For`, 'g');
  content = content.replace(regex, '// For');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Removed duplicate ${varName} from ${filePath}`);
}

removeDuplicate('e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\sites\\[siteId]\\route.ts', 'siteId');
