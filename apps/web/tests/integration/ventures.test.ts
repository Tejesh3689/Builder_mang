import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeStatus } from '@prisma/client';
import { actAs, assign, call, makeEmployee, makeUser, makeVenture, prisma } from './helpers';

// Route modules must be imported after the session mock is registered (helpers).
const ventures = await import('@/app/api/ventures/route');
const venture = await import('@/app/api/ventures/[ventureId]/route');
const archive = await import('@/app/api/ventures/[ventureId]/archive/route');
const members = await import('@/app/api/ventures/[ventureId]/members/route');
const settings = await import('@/app/api/ventures/[ventureId]/settings/route');
const materials = await import('@/app/api/ventures/[ventureId]/materials/route');
const { authOptions } = await import('@/lib/auth');

let admin: Awaited<ReturnType<typeof makeUser>>;
let manager: Awaited<ReturnType<typeof makeUser>>;
let supervisor: Awaited<ReturnType<typeof makeUser>>;
let leader: Awaited<ReturnType<typeof makeUser>>;
let mine: Awaited<ReturnType<typeof makeVenture>>;
let other: Awaited<ReturnType<typeof makeVenture>>;

before(async () => {
  admin = await makeUser('ADMIN');
  manager = await makeUser('MANAGER');
  supervisor = await makeUser('SUPERVISOR');
  leader = await makeUser('MANAGER');
  mine = await makeVenture();
  other = await makeVenture();
  await assign(manager.employee!.id, mine.id);
});

describe('platform: auth, JSON, error mapping', () => {
  test('no session -> 401', async () => {
    actAs(null);
    assert.equal((await call(ventures.GET)).status, 401);
  });

  test('malformed JSON -> 400, never 500', async () => {
    actAs(admin.id);
    const r = await call(ventures.POST, { method: 'POST', rawBody: '{"name":', headers: { 'content-type': 'application/json' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.error, 'Request body must be valid JSON');
  });

  test('wrong-type fields -> 400 with field, no Prisma text (VENT-03)', async () => {
    actAs(admin.id);
    const r = await call(ventures.POST, { method: 'POST', body: { name: 12345, code: 'X' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.field, 'name');
    assert.ok(!JSON.stringify(r.json).includes('prisma'));
  });

  test('role without permission -> 403', async () => {
    actAs(supervisor.id);
    const r = await call(ventures.POST, { method: 'POST', body: { name: 'X', code: 'NOPE' } });
    assert.equal(r.status, 403);
  });

  test('inactive user with a live session -> 401', async () => {
    const u = await makeUser('ADMIN', { isActive: false });
    actAs(u.id);
    assert.equal((await call(ventures.GET)).status, 401);
  });

  test('terminated employee with an active User row -> 401 (account policy)', async () => {
    const u = await makeUser('ADMIN');
    await prisma.employee.update({ where: { id: u.employee!.id }, data: { status: EmployeeStatus.TERMINATED } });
    actAs(u.id);
    assert.equal((await call(ventures.GET)).status, 401);
  });

  test('jwt callback: revoked sessionVersion / deactivation -> empty token; role downgrade synced', async () => {
    const u = await makeUser('MANAGER');
    const jwt = authOptions.callbacks!.jwt! as any;
    const tok = await jwt({ token: { id: u.id, sessionVersion: 1, role: 'MANAGER' } });
    assert.equal(tok.role, 'MANAGER');

    await prisma.user.update({ where: { id: u.id }, data: { role: 'SUPERVISOR' } });
    assert.equal((await jwt({ token: { id: u.id, sessionVersion: 1, role: 'MANAGER' } })).role, 'SUPERVISOR');

    await prisma.user.update({ where: { id: u.id }, data: { sessionVersion: { increment: 1 } } });
    assert.deepEqual(await jwt({ token: { id: u.id, sessionVersion: 1 } }), {});

    await prisma.user.update({ where: { id: u.id }, data: { isActive: false } });
    assert.deepEqual(await jwt({ token: { id: u.id, sessionVersion: 2 } }), {});
  });
});

describe('venture resource scope', () => {
  test('MANAGER: list contains only assigned ventures', async () => {
    actAs(manager.id);
    const r = await call(ventures.GET);
    const ids = r.json.data.map((v: any) => v.id);
    assert.ok(ids.includes(mine.id));
    assert.ok(!ids.includes(other.id));
  });

  test('MANAGER: GET/PATCH/DELETE/archive outside scope -> 404; inside -> 200', async () => {
    actAs(manager.id);
    assert.equal((await call(venture.GET, { params: { ventureId: other.id } })).status, 404);
    assert.equal((await call(venture.GET, { params: { ventureId: other.code } })).status, 404);
    assert.equal((await call(venture.PATCH, { method: 'PATCH', params: { ventureId: other.id }, body: { name: 'hijack' } })).status, 404);
    assert.equal((await call(venture.DELETE, { method: 'DELETE', params: { ventureId: other.id } })).status, 404);
    assert.equal((await call(archive.POST, { method: 'POST', params: { ventureId: other.id } })).status, 404);
    assert.equal((await call(members.GET, { params: { ventureId: other.id } })).status, 404);
    assert.equal((await call(settings.GET, { params: { ventureId: other.id } })).status, 404);
    assert.equal((await call(materials.GET, { params: { ventureId: other.id } })).status, 404);
    assert.equal((await call(venture.GET, { params: { ventureId: mine.id } })).status, 200);
    assert.equal((await prisma.venture.findUnique({ where: { id: other.id } }))?.name, other.name);
  });
});

describe('venture create / update', () => {
  test('duplicate code -> 409 (sequential and concurrent)', async () => {
    actAs(admin.id);
    const body = { name: 'Dup', code: `DUP-${Date.now()}` };
    assert.equal((await call(ventures.POST, { method: 'POST', body })).status, 201);
    const again = await call(ventures.POST, { method: 'POST', body });
    assert.equal(again.status, 409);
    assert.equal(again.json.error, 'A venture with this code already exists.');

    const raceBody = { name: 'Race', code: `RACE-${Date.now()}` };
    const results = await Promise.all([1, 2, 3].map(() => call(ventures.POST, { method: 'POST', body: raceBody })));
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409]);
    assert.equal(await prisma.venture.count({ where: { code: raceBody.code } }), 1);
  });

  test('cross-field rules (VENT-05/08/09)', async () => {
    actAs(admin.id);
    const post = (extra: object) => call(ventures.POST, { method: 'POST', body: { name: 'X', code: `CF-${Math.random()}`, ...extra } });
    assert.equal((await post({ startDate: '2026-06-01', expectedCompletionDate: '2026-01-01' })).status, 400);
    assert.equal((await post({ latitude: 12.9 })).status, 400);
    const missing = await post({ projectDirectorId: '00000000-0000-0000-0000-000000000000' });
    assert.equal(missing.status, 400);
    assert.equal(missing.json.field, 'projectDirectorId');
    const noLogin = await makeEmployee();
    assert.match((await post({ projectManagerId: noLogin.id })).json.error, /no user account/);
  });

  test('PATCH records old/new values for budget and leadership', async () => {
    actAs(admin.id);
    const v = await makeVenture({ estimatedBudget: 100 });
    const r = await call(venture.PATCH, {
      method: 'PATCH',
      params: { ventureId: v.id },
      body: { estimatedBudget: 250, projectManagerId: leader.employee!.id, description: 'notes' },
    });
    assert.equal(r.status, 200);
    const log = await prisma.auditLog.findFirst({ where: { ventureId: v.id, action: 'UPDATE_VENTURE' } });
    const details = JSON.parse(log!.details);
    assert.deepEqual(details.changes.estimatedBudget, { old: 100, new: 250 });
    assert.deepEqual(details.changes.projectManagerId, { old: null, new: leader.employee!.id });
    assert.deepEqual(details.otherFieldsUpdated, ['description']);
  });

  test('PATCH date-only and ISO accepted alike; impossible date rejected', async () => {
    actAs(admin.id);
    const v = await makeVenture();
    assert.equal((await call(venture.PATCH, { method: 'PATCH', params: { ventureId: v.id }, body: { planningStartDate: '2026-06-01' } })).status, 200);
    assert.equal((await call(venture.PATCH, { method: 'PATCH', params: { ventureId: v.id }, body: { startDate: '2026-02-29' } })).status, 400);
  });
});

describe('venture delete lifecycle', () => {
  test('venture with business history -> 409, nothing deleted', async () => {
    actAs(admin.id);
    const v = await makeVenture();
    const e = await makeEmployee();
    await assign(e.id, v.id);
    const r = await call(venture.DELETE, { method: 'DELETE', params: { ventureId: v.id } });
    assert.equal(r.status, 409);
    assert.equal(r.json.details.history.assignments, 1);
    assert.ok(await prisma.venture.findUnique({ where: { id: v.id } }));
  });

  test('venture created through the API with no history can be deleted; audited', async () => {
    actAs(admin.id);
    const created = await call(ventures.POST, { method: 'POST', body: { name: 'Temp', code: `TMP-${Date.now()}` } });
    const id = created.json.data.id;
    const r = await call(venture.DELETE, { method: 'DELETE', params: { ventureId: id } });
    assert.equal(r.status, 200);
    assert.equal(await prisma.venture.findUnique({ where: { id } }), null);
    const log = await prisma.auditLog.findFirst({ where: { action: 'DELETE_VENTURE' }, orderBy: { createdAt: 'desc' } });
    assert.equal(JSON.parse(log!.details).id, id);
  });

  test('after an edit (audited history) delete is refused; archive works', async () => {
    actAs(admin.id);
    const created = await call(ventures.POST, { method: 'POST', body: { name: 'Edited', code: `ED-${Date.now()}` } });
    const id = created.json.data.id;
    await call(venture.PATCH, { method: 'PATCH', params: { ventureId: id }, body: { estimatedBudget: 5 } });
    assert.equal((await call(venture.DELETE, { method: 'DELETE', params: { ventureId: id } })).status, 409);
    const arch = await call(archive.POST, { method: 'POST', params: { ventureId: id } });
    assert.equal(arch.status, 200);
    assert.equal(arch.json.data.status, 'ARCHIVED');
    assert.equal((await call(archive.POST, { method: 'POST', params: { ventureId: id } })).status, 409);
  });
});
