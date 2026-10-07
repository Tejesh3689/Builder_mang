const fs = require('fs');

// 1. Fix siteId duplicate
const siteIdPath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\workforce\\sites\\[siteId]\\route.ts';
let siteIdContent = fs.readFileSync(siteIdPath, 'utf8');
siteIdContent = siteIdContent.replace(/const \{ siteId \} = await params;\s*\/\/\s*For site allocations/g, '// For site allocations');
fs.writeFileSync(siteIdPath, siteIdContent, 'utf8');
console.log('Fixed siteId');

// 2. Remove logAudit from GET routes
const paths = [
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\settings\\route.ts',
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\documents\\route.ts',
  'e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\announcements\\route.ts'
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    // regex to replace logAudit inside GET block only.
    // simpler: replace logAudit before NextResponse.json in the first half of the file (which is GET)
    const getMatch = c.match(/export async function GET[\s\S]*?export async function/);
    if (getMatch) {
      const getBlock = getMatch[0];
      const newGetBlock = getBlock.replace(/await logAudit\([^)]+\);\s*/g, '');
      c = c.replace(getBlock, newGetBlock);
      fs.writeFileSync(p, c, 'utf8');
      console.log('Removed logAudit from GET in', p);
    } else {
      // If no other export async function, just replace the first one
      const getMatchEnd = c.match(/export async function GET[\s\S]*$/);
      if (getMatchEnd) {
        const getBlock = getMatchEnd[0];
        const newGetBlock = getBlock.replace(/await logAudit\([^)]+\);\s*/g, '');
        c = c.replace(getBlock, newGetBlock);
        fs.writeFileSync(p, c, 'utf8');
        console.log('Removed logAudit from GET (end) in', p);
      }
    }
  }
});
