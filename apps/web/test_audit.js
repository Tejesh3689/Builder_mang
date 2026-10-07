// Use native fetch
const fs = require('fs');
const envStr = fs.readFileSync('e:\\Builder_mang\\apps\\web\\.env', 'utf8');
const match = envStr.match(/DATABASE_URL="([^"]+)"/);
if (match) {
  process.env.DATABASE_URL = match[1];
} else {
  const match2 = envStr.match(/DATABASE_URL=(.+)/);
  if (match2) process.env.DATABASE_URL = match2[1].trim();
}
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function main() {
  // 1. Create a test user
  const email = 'test_audit@builder.com';
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { isActive: true, role: 'MANAGER', passwordHash: hash, sessionVersion: 1 },
    create: { email, name: 'Test Audit', role: 'MANAGER', passwordHash: hash, isActive: true, sessionVersion: 1 }
  });
  console.log('Test user created/updated');

  // 2. Fetch CSRF Token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const cookie = csrfRes.headers.get('set-cookie').split(';')[0];
  
  console.log('CSRF Token:', csrfToken);

  // 3. Login
  const loginParams = new URLSearchParams();
  loginParams.append('email', email);
  loginParams.append('password', password);
  loginParams.append('csrfToken', csrfToken);
  loginParams.append('json', 'true');

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    },
    body: loginParams
  });

  const setCookieHeader = loginRes.headers.raw()['set-cookie'];
  if (!setCookieHeader) {
      console.log('Login failed', await loginRes.text());
      return;
  }
  const sessionCookie = setCookieHeader.find(c => c.startsWith('next-auth.session-token') || c.startsWith('__Secure-next-auth.session-token'));
  console.log('Session Cookie retrieved:', !!sessionCookie);

  // 4. Hit a protected endpoint to verify it works
  const protectedRes = await fetch(`${BASE_URL}/api/ventures`, {
    headers: { 'Cookie': sessionCookie }
  });
  console.log('Protected endpoint status before logout:', protectedRes.status);

  // 5. Logout
  // Let's hook the custom event manually by calling NextAuth signout
  const logoutParams = new URLSearchParams();
  logoutParams.append('csrfToken', csrfToken);
  logoutParams.append('json', 'true');
  
  await fetch(`${BASE_URL}/api/auth/signout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `${cookie}; ${sessionCookie}`
    },
    body: logoutParams
  });
  console.log('Logged out (triggered events.signOut hopefully)');

  // 6. Replay
  const replayRes = await fetch(`${BASE_URL}/api/ventures`, {
    headers: { 'Cookie': sessionCookie }
  });
  console.log('Protected endpoint status after logout replay:', replayRes.status);

  // 7. Test malformed JSON
  const malformedRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: '{"email":"test_audit@builder.com", "password":' // malformed
  });
  console.log('Malformed JSON login status:', malformedRes.status);

  await prisma.$disconnect();
}

main().catch(console.error);
