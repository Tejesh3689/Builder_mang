import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeStatus, LeaveStatus } from '@prisma/client';
import { actAs, assign, call, makeEmployee, makeUser, makeVenture, prisma } from './helpers';

const employees = await import('@/app/api/employees/route');
const employee = await import('@/app/api/employees/[id]/route');
const ventures = await import('@/app/api/ventures/route');
const ventureItem = await import('@/app/api/ventures/[ventureId]/route');

let admin: Awaited<ReturnType<typeof makeUser>>;
let manager: Awaited<ReturnType<typeof makeUser>>;

before(async () => {
  admin = await makeUser('ADMIN');
  manager = await makeUser('MANAGER');
  const v = await makeVenture();
  await assign(manager.employee!.id, v.id);
});

const create = (body: object) => call(employees.POST, { method: 'POST', body: { firstName: 'New', designation: 'Mason', ...body } });
const patch = (id: string, body: object) => call(employee.PATCH, { method: 'PATCH', params: { id }, body });

describe('employee create validation', () => {
  test('happy path normalises email/phone and generates a code', async () => {
    actAs(admin.id);
    const r = await create({ email: ' Ravi.K@Example.com ', phone: '98450 11111', joiningDate: '2026-01-15', employmentType: 'Permanent' });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.data.email, 'ravi.k@example.com');
    assert.equal(r.json.data.phone, '+919845011111');
    assert.match(r.json.data.employeeId, /^EMP-\d{4,}$/);
    assert.equal(r.json.data.joiningDate, '2026-01-15');
  });

  test('whitespace-only / wrong types / bad email / bad phone -> 400 with field', async () => {
    actAs(admin.id);
    assert.equal((await create({ firstName: '   ' })).json.field, 'firstName');
    assert.equal((await create({ designation: 42 })).json.field, 'designation');
    assert.equal((await create({ email: 'nope' })).json.field, 'email');
    assert.equal((await create({ phone: '12345' })).json.field, 'phone');
    assert.equal((await create({ joiningDate: '2026-02-30' })).json.field, 'joiningDate');
  });

  test('non-admin cannot create employees', async () => {
    actAs(manager.id);
    assert.equal((await create({})).status, 403);
  });

  test('concurrent creates get distinct codes', async () => {
    actAs(admin.id);
    const rs = await Promise.all([1, 2, 3, 4].map((i) => create({ firstName: `Par${i}` })));
    assert.deepEqual(rs.map((r) => r.status), [201, 201, 201, 201]);
    assert.equal(new Set(rs.map((r) => r.json.data.employeeId)).size, 4);
  });
});

describe('duplicate contact protection', () => {
  test('duplicate email is case-insensitive -> 409', async () => {
    actAs(admin.id);
    assert.equal((await create({ email: 'dup.person@test.local' })).status, 201);
    const r = await create({ email: 'DUP.Person@test.local' });
    assert.equal(r.status, 409);
    assert.equal(r.json.details.field, 'email');
  });

  test('duplicate phone matches across formats, incl. legacy stored formatting -> 409', async () => {
    actAs(admin.id);
    await makeEmployee({ phone: '+91 99662 21969' }); // legacy, un-normalised row
    const r = await create({ phone: '9966221969' });
    assert.equal(r.status, 409);
    assert.equal(r.json.details.field, 'phone');
  });

  test('concurrent creates with the same email -> exactly one succeeds', async () => {
    actAs(admin.id);
    const email = `race-${Date.now()}@test.local`;
    const rs = await Promise.all([1, 2, 3].map(() => create({ email })));
    assert.deepEqual(rs.map((r) => r.status).sort(), [201, 409, 409]);
  });

  test('PATCH to another employee\'s email -> 409; keeping own email is fine', async () => {
    actAs(admin.id);
    const a = (await create({ email: `a-${Date.now()}@test.local` })).json.data;
    const b = (await create({ email: `b-${Date.now()}@test.local` })).json.data;
    assert.equal((await patch(b.id, { email: a.email })).status, 409);
    assert.equal((await patch(a.id, { email: a.email.toUpperCase(), designation: 'Foreman' })).status, 200);
  });
});

describe('reporting manager hierarchy', () => {
  test('self, 2-cycle, 3-cycle and longer cycles are rejected', async () => {
    actAs(admin.id);
    const [a, b, c, d] = await Promise.all([makeEmployee(), makeEmployee(), makeEmployee(), makeEmployee()]);
    assert.match((await patch(a.id, { reportingManagerId: a.id })).json.error, /themselves/);

    assert.equal((await patch(a.id, { reportingManagerId: b.id })).status, 200); // a -> b
    assert.match((await patch(b.id, { reportingManagerId: a.id })).json.error, /circular/); // 2-cycle

    assert.equal((await patch(b.id, { reportingManagerId: c.id })).status, 200); // a -> b -> c
    assert.match((await patch(c.id, { reportingManagerId: a.id })).json.error, /circular/); // 3-cycle

    assert.equal((await patch(c.id, { reportingManagerId: d.id })).status, 200); // a -> b -> c -> d
    assert.equal((await patch(d.id, { reportingManagerId: a.id })).status, 400); // 4-cycle
    assert.equal((await patch(d.id, { reportingManagerId: null })).status, 200);
  });

  test('invalid, terminated, or deactivated manager -> 400 (never a raw FK error)', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const missing = await patch(e.id, { reportingManagerId: '00000000-0000-0000-0000-000000000000' });
    assert.equal(missing.status, 400);
    assert.match(missing.json.error, /does not exist/);

    const gone = await makeEmployee({ status: EmployeeStatus.TERMINATED });
    assert.match((await patch(e.id, { reportingManagerId: gone.id })).json.error, /terminated/);

    const locked = await makeUser('SUPERVISOR', { isActive: false });
    assert.match((await patch(e.id, { reportingManagerId: locked.employee!.id })).json.error, /inactive/);

    // A manager without a login account is allowed (field hierarchy).
    const foreman = await makeEmployee();
    assert.equal((await patch(e.id, { reportingManagerId: foreman.id })).status, 200);
  });
});

describe('employee resource scope', () => {
  test('MANAGER cannot read or modify an employee outside their ventures', async () => {
    const outsider = await makeEmployee();
    actAs(manager.id);
    assert.equal((await call(employee.GET, { params: { id: outsider.id } })).status, 404);
    assert.equal((await patch(outsider.id, { designation: 'Hijacked' })).status, 404);
    assert.equal((await prisma.employee.findUnique({ where: { id: outsider.id } }))?.designation, 'Mason');
  });

  test('MANAGER can edit an in-scope employee but cannot terminate', async () => {
    const v = await prisma.employeeVentureAssignment.findFirst({ where: { employeeId: manager.employee!.id } });
    const worker = await makeEmployee();
    await assign(worker.id, v!.ventureId);
    actAs(manager.id);
    assert.equal((await patch(worker.id, { designation: 'Foreman' })).status, 200);
    assert.equal((await patch(worker.id, { status: 'TERMINATED' })).status, 403);
    assert.equal((await call(employee.DELETE, { method: 'DELETE', params: { id: worker.id } })).status, 403);
  });
});

describe('termination lifecycle', () => {
  test('blocked while leading an open venture or managing active reports', async () => {
    actAs(admin.id);
    const boss = await makeUser('MANAGER');
    const v = await makeVenture({ projectManagerId: boss.employee!.id });
    const r1 = await call(employee.DELETE, { method: 'DELETE', params: { id: boss.employee!.id } });
    assert.equal(r1.status, 409);
    assert.deepEqual(r1.json.details.ventures, [v.code]);

    await prisma.venture.update({ where: { id: v.id }, data: { projectManagerId: null } });
    await makeEmployee({ reportingManagerId: boss.employee!.id });
    const r2 = await call(employee.DELETE, { method: 'DELETE', params: { id: boss.employee!.id } });
    assert.equal(r2.status, 409);
    assert.equal(r2.json.details.activeReports, 1);
  });

  test('terminates: user deactivated + sessions revoked, assignments ended, pending leave cancelled', async () => {
    actAs(admin.id);
    const u = await makeUser('SUPERVISOR');
    const empId = u.employee!.id;
    const v = await makeVenture();
    await assign(empId, v.id);
    await prisma.leaveRequest.create({
      data: { employeeId: empId, type: 'CASUAL', startDate: new Date(), endDate: new Date(), status: LeaveStatus.PENDING },
    });

    const r = await call(employee.DELETE, { method: 'DELETE', params: { id: empId } });
    assert.equal(r.status, 200, JSON.stringify(r.json));

    const after = await prisma.user.findUnique({ where: { id: u.id } });
    assert.equal(after!.isActive, false);
    assert.equal(after!.sessionVersion, u.sessionVersion + 1);
    assert.equal(await prisma.employeeVentureAssignment.count({ where: { employeeId: empId, status: 'ACTIVE' } }), 0);
    assert.equal(await prisma.leaveRequest.count({ where: { employeeId: empId, status: LeaveStatus.PENDING } }), 0);
    assert.ok(await prisma.auditLog.findFirst({ where: { action: 'TERMINATE_EMPLOYEE', details: { contains: empId } } }));

    // The terminated user is rejected by protected APIs even with a live session...
    actAs(u.id);
    assert.equal((await call(employees.GET)).status, 401);

    // ...and cannot be selected as a reporting manager or venture leader.
    actAs(admin.id);
    const other = await makeEmployee();
    assert.equal((await patch(other.id, { reportingManagerId: empId })).status, 400);
    const leaderTry = await call(ventures.POST, { method: 'POST', body: { name: 'L', code: `L-${Date.now()}`, siteManagerId: empId } });
    assert.match(leaderTry.json.error, /terminated/);
    assert.equal((await call(ventureItem.PATCH, { method: 'PATCH', params: { ventureId: v.id }, body: { siteManagerId: empId } })).status, 400);

    // Terminating twice -> 409; editing a terminated employee -> 409.
    assert.equal((await call(employee.DELETE, { method: 'DELETE', params: { id: empId } })).status, 409);
    assert.equal((await patch(empId, { designation: 'x' })).status, 409);
  });

  test('PATCH status=TERMINATED uses the same lifecycle; reactivation restores login', async () => {
    actAs(admin.id);
    const u = await makeUser('SUPERVISOR');
    assert.equal((await patch(u.employee!.id, { status: 'TERMINATED' })).status, 200);
    assert.equal((await prisma.user.findUnique({ where: { id: u.id } }))!.isActive, false);

    assert.equal((await patch(u.employee!.id, { status: 'ACTIVE' })).status, 200);
    const back = await prisma.user.findUnique({ where: { id: u.id } });
    assert.equal(back!.isActive, true);
    assert.equal(back!.sessionVersion, u.sessionVersion + 1); // old sessions stay revoked
  });
});
