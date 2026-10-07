const fs = require('fs');

let p = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\onboarding\\route.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/export async function GET\(\) {\s*try {/, `export async function GET() {
  try {
    const user = await requireAuth();
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
`);

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed onboarding GET');
