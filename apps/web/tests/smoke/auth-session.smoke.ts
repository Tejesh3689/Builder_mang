/**
 * End-to-end HTTP smoke test against a RUNNING server (real NextAuth, middleware,
 * JWT callback, Postgres). Not part of `npm test`.
 *
 *   BASE_URL=http://localhost:3100 DATABASE_URL=<same LOCAL db the server uses> npx tsx tests/smoke/auth-session.smoke.ts
 */
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const host = new URL(process.env.DATABASE_URL ?? '').hostname;
if (!['localhost', '127.0.0.1'].includes(host)) throw new Error('Refusing to run against a non-local database');
const prisma = new PrismaClient();

class Client {
  cookies = new Map<string, string>();
  private header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  async fetch(path: string, init: RequestInit = {}) {
    console.log('  ->', init.method ?? 'GET', path);
    const res = await fetch(BASE + path, { ...init, redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { ...(init.headers as any), cookie: this.header() } });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    return res;
  }
  async login(email: string, password: string) {
    const { csrfToken } = await (await this.fetch('/api/auth/csrf')).json();
    await this.fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, email, password, json: 'true' }),
    });
    return [...this.cookies.keys()].some((k) => k.includes('session-token'));
  }
}

const results: [string, boolean][] = [];
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push([name, true]);
  } catch (e) {
    results.push([name, false]);
    console.error(`✖ ${name}:`, (e as Error).message);
  }
}

const stamp = Date.now();
const password = 'Sm0ke-test-pass';
const hash = await bcrypt.hash(password, 10);
const admin = await prisma.user.create({ data: { email: `smoke-admin-${stamp}@test.local`, name: 'Smoke Admin', passwordHash: hash, role: 'ADMIN' } });
const worker = await prisma.user.create({
  data: {
    email: `smoke-worker-${stamp}@test.local`, name: 'Smoke Worker', passwordHash: hash, role: 'SUPERVISOR',
    employee: { create: { employeeId: `SMK-${stamp}`, firstName: 'Smoke', lastName: 'Worker', designation: 'x', department: 'y' } },
  },
  include: { employee: true },
});

await step('unauthenticated API call -> 401 from middleware', async () => {
  assert.equal((await new Client().fetch('/api/ventures')).status, 401);
});

await step('login works with sessionVersion (no migration/login breakage)', async () => {
  const c = new Client();
  assert.ok(await c.login(admin.email, password), 'no session cookie issued');
  assert.equal((await c.fetch('/api/ventures')).status, 200);
});

await step('wrong password -> no session', async () => {
  assert.equal(await new Client().login(admin.email, 'nope-nope'), false);
});

await step('malformed JSON over real HTTP -> 400', async () => {
  const c = new Client();
  await c.login(admin.email, password);
  const r = await c.fetch('/api/ventures', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"name":' });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, 'Request body must be valid JSON');
});

await step('logout revokes the session token (sessionVersion bump)', async () => {
  const c = new Client();
  await c.login(admin.email, password);
  const stolen = new Client();
  stolen.cookies = new Map(c.cookies);
  const { csrfToken } = await (await c.fetch('/api/auth/csrf')).json();
  await c.fetch('/api/auth/signout', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, json: 'true' }),
  });
  assert.equal((await stolen.fetch('/api/ventures')).status, 401, 'old token still accepted after logout');
});

await step('role downgrade applies to an existing session immediately', async () => {
  const c = new Client();
  await c.login(admin.email, password);
  await prisma.user.update({ where: { id: admin.id }, data: { role: 'SUPERVISOR' } });
  const r = await c.fetch('/api/ventures', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'x', code: `SMK-${stamp}` }) });
  assert.equal(r.status, 403);
  await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
});

await step('terminating an employee kills their live session and blocks re-login', async () => {
  const w = new Client();
  assert.ok(await w.login(worker.email, password));
  assert.equal((await w.fetch('/api/employees')).status, 200);

  const a = new Client();
  await a.login(admin.email, password);
  const r = await a.fetch(`/api/employees/${worker.employee!.id}`, { method: 'DELETE' });
  assert.equal(r.status, 200, await r.text());

  assert.equal((await w.fetch('/api/employees')).status, 401, 'terminated user still has access');
  assert.equal(await new Client().login(worker.email, password), false, 'terminated user can log in again');
});

for (const [name, ok] of results) console.log(`${ok ? '✔' : '✖'} ${name}`);
await prisma.$disconnect();
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
