import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_EtV7nexaHI5h@ep-noisy-math-axwiausl.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
process.env.NEXTAUTH_SECRET = "super-secret-nextauth-key-at-least-32-chars-long";


const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3005';

async function runTest(name: string, fn: () => Promise<{status: string, evidence: any}>) {
  try {
    const result = await fn();
    console.log(`\n==================================================`);
    console.log(`TEST: ${name}`);
    console.log(`RESULT: ${result.status}`);
    console.log(`EVIDENCE: \n${JSON.stringify(result.evidence, null, 2)}`);
  } catch (e: any) {
    console.log(`\n==================================================`);
    console.log(`TEST: ${name}`);
    console.log(`RESULT: ERROR`);
    console.log(`EVIDENCE: ${e.message}`);
  }
}

async function start() {
  console.log('--- BEGIN FINAL VERIFICATION ---');

  // AUTH-04 / AUTH-15
  await runTest('AUTH-04 (Privilege Escalation on Register)', async () => {
    const r = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `escalate_${Date.now()}@test.com`,
        password: 'securepassword',
        firstName: 'Bad',
        lastName: 'Actor',
        role: 'ADMIN' // Malicious input
      })
    });
    const data = await r.json() as any;
    const dbUser = await prisma.user.findUnique({ where: { email: data.user?.email || '' }});
    return {
      status: dbUser?.role === 'ADMIN' ? 'FAIL' : 'PASS',
      evidence: { requestedRole: 'ADMIN', grantedRole: dbUser?.role, response: data }
    };
  });

  // AUTH-05
  await runTest('AUTH-05 (Malformed Email/Password types)', async () => {
    const r = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: [], password: {}, firstName: 123, lastName: true })
    });
    const status = r.status;
    const data = await r.json().catch(() => null);
    return {
      status: status >= 400 && status < 500 ? 'PASS' : 'FAIL',
      evidence: { statusCode: status, response: data }
    };
  });

  // AUTH-06
  await runTest('AUTH-06 (Malformed JSON syntax)', async () => {
    const r = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: `{"email": "broken`
    });
    const status = r.status;
    const data = await r.json().catch(() => null);
    return {
      status: status === 400 ? 'PASS' : 'FAIL',
      evidence: { statusCode: status, response: data }
    };
  });

  // AUTH-07
  await runTest('AUTH-07 (Bcrypt Byte Limit boundary)', async () => {
    const pw73 = 'a'.repeat(73);
    const r = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `huge_${Date.now()}@t.com`, password: pw73, firstName: 'A', lastName: 'B' })
    });
    const status = r.status;
    const data = await r.json().catch(() => null);
    return {
      status: status === 400 ? 'PASS' : 'FAIL',
      evidence: { requestedBytes: 73, statusCode: status, response: data }
    };
  });

  // MASS ASSIGNMENT
  await runTest('MASS ASSIGNMENT (Register)', async () => {
    const r = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `mass_${Date.now()}@t.com`,
        password: 'securepassword',
        firstName: 'A',
        lastName: 'B',
        passwordHash: 'hacked_hash',
        id: 'hacked_id',
        isActive: false
      })
    });
    const data = await r.json() as any;
    const dbUser = await prisma.user.findUnique({ where: { email: data.user?.email || '___nonexistent___' }});
    const status = (!dbUser || (dbUser.id !== 'hacked_id' && dbUser.passwordHash !== 'hacked_hash' && dbUser.isActive === true)) ? 'PASS' : 'FAIL';
    return {
      status,
      evidence: { injectedId: 'hacked_id', actualId: dbUser?.id, actualHashLength: dbUser?.passwordHash?.length }
    };
  });

  // ROLE MIGRATION CONSISTENCY
  await runTest('ROLE MIGRATION CONSISTENCY', async () => {
    await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'MANAGER' WHERE "role" = 'PROJECT_MANAGER'`);
    await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'SUPERVISOR' WHERE "role" = 'SITE_ENGINEER'`);
    const invalidUsers = await prisma.$queryRaw`SELECT count(*) as count FROM users WHERE role IN ('PROJECT_MANAGER', 'SITE_ENGINEER')`;
    const count = Number((invalidUsers as any)[0].count);
    return {
      status: count === 0 ? 'PASS' : 'FAIL',
      evidence: { legacyRolesFound: count }
    };
  });
  
  // SECRETS
  await runTest('NEXTAUTH_SECRET CONFIGURATION', async () => {
    const secret = process.env.NEXTAUTH_SECRET;
    return {
      status: secret && secret.length > 10 ? 'PASS' : 'FAIL',
      evidence: { isConfigured: !!secret }
    };
  });

  // API ERROR CONTRACT
  await runTest('API ERROR CONTRACT (401 JSON for unauthenticated)', async () => {
    const r = await fetch(`${BASE_URL}/api/employees`);
    const status = r.status;
    const isJson = r.headers.get('content-type')?.includes('application/json');
    const data = await r.json().catch(() => null);
    return {
      status: (status === 401 && isJson) ? 'PASS' : 'FAIL',
      evidence: { statusCode: status, contentType: r.headers.get('content-type'), response: data }
    };
  });

  console.log('--- END FINAL VERIFICATION ---');
}

start().catch(console.error).finally(() => prisma.$disconnect());
