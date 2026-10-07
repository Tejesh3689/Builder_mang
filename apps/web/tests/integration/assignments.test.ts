import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeStatus, VentureStatus } from '@prisma/client';
import { actAs, assign, call, makeEmployee, makeUser, makeVenture, prisma } from './helpers';

const empAssignments = await import('@/app/api/employees/[id]/assignments/route');
const assignmentItem = await import('@/app/api/assignments/[id]/route');
const members = await import('@/app/api/ventures/[ventureId]/members/route');

let admin: Awaited<ReturnType<typeof makeUser>>;
let manager: Awaited<ReturnType<typeof makeUser>>;
let managerVenture: Awaited<ReturnType<typeof makeVenture>>;

before(async () => {
  admin = await makeUser('ADMIN');
  manager = await makeUser('MANAGER');
  managerVenture = await makeVenture();
  await assign(manager.employee!.id, managerVenture.id);
});

const assignTo = (employeeId: string, body: object) =>
  call(empAssignments.POST, { method: 'POST', params: { id: employeeId }, body });

describe('assignment validation', () => {
  test('employee/venture must exist; accessLevel allowlist', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const v = await makeVenture();
    assert.equal((await assignTo('00000000-0000-0000-0000-000000000000', { ventureId: v.id })).status, 404);
    assert.equal((await assignTo(e.id, { ventureId: '00000000-0000-0000-0000-000000000000' })).status, 404);
    const bad = await assignTo(e.id, { ventureId: v.id, accessLevel: 'GOD_MODE' });
    assert.equal(bad.status, 400);
    assert.equal(bad.json.field, 'accessLevel');
    assert.equal((await assignTo(e.id, { ventureId: v.id, accessLevel: 'READ_ONLY' })).status, 201);
  });

  test('duplicate active assignment -> 409 (sequential and concurrent)', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const v = await makeVenture();
    assert.equal((await assignTo(e.id, { ventureId: v.id })).status, 201);
    assert.equal((await assignTo(e.id, { ventureId: v.id })).status, 409);

    const e2 = await makeEmployee();
    const rs = await Promise.all([1, 2, 3].map(() => assignTo(e2.id, { ventureId: v.id })));
    assert.deepEqual(rs.map((r) => r.status).sort(), [201, 409, 409]);
    assert.equal(await prisma.employeeVentureAssignment.count({ where: { employeeId: e2.id } }), 1);
  });

  test('terminated employee or archived venture -> 409', async () => {
    actAs(admin.id);
    const gone = await makeEmployee({ status: EmployeeStatus.TERMINATED });
    assert.equal((await assignTo(gone.id, { ventureId: (await makeVenture()).id })).status, 409);
    const archived = await makeVenture({ status: VentureStatus.ARCHIVED });
    assert.equal((await assignTo((await makeEmployee()).id, { ventureId: archived.id })).status, 409);
  });

  test('reassignment completes the previous assignment; returning reactivates the old row', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const [v1, v2] = [await makeVenture(), await makeVenture()];
    await assignTo(e.id, { ventureId: v1.id });
    await assignTo(e.id, { ventureId: v2.id });
    const rows = await prisma.employeeVentureAssignment.findMany({ where: { employeeId: e.id } });
    assert.equal(rows.find((r) => r.ventureId === v1.id)!.status, 'COMPLETED');
    assert.equal(rows.find((r) => r.ventureId === v2.id)!.status, 'ACTIVE');

    assert.equal((await assignTo(e.id, { ventureId: v1.id })).status, 201);
    assert.equal(await prisma.employeeVentureAssignment.count({ where: { employeeId: e.id } }), 2);
    assert.equal(await prisma.employeeVentureAssignment.count({ where: { employeeId: e.id, status: 'ACTIVE' } }), 1);
  });

  test('reporting manager passed with the assignment goes through hierarchy rules', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const r = await assignTo(e.id, { ventureId: (await makeVenture()).id, reportingManager: e.id });
    assert.equal(r.status, 400);
    assert.equal(await prisma.employeeVentureAssignment.count({ where: { employeeId: e.id } }), 0); // rolled back
  });
});

describe('leadership protection', () => {
  test('cannot end, remove or move away from a venture the employee leads', async () => {
    actAs(admin.id);
    const lead = await makeUser('MANAGER');
    const v = await makeVenture({ siteManagerId: lead.employee!.id });
    const a = await assign(lead.employee!.id, v.id);

    const end = await call(assignmentItem.PATCH, { method: 'PATCH', params: { id: a.id }, body: { status: 'COMPLETED' } });
    assert.equal(end.status, 409);
    assert.deepEqual(end.json.details.roles, ['siteManagerId']);
    assert.equal((await call(assignmentItem.DELETE, { method: 'DELETE', params: { id: a.id } })).status, 409);
    assert.equal((await assignTo(lead.employee!.id, { ventureId: (await makeVenture()).id })).status, 409);

    await prisma.venture.update({ where: { id: v.id }, data: { siteManagerId: null } });
    assert.equal((await call(assignmentItem.PATCH, { method: 'PATCH', params: { id: a.id }, body: { status: 'COMPLETED' } })).status, 200);
  });
});

describe('assignment scope', () => {
  test('MANAGER cannot pull an employee off a venture they do not manage', async () => {
    actAs(admin.id);
    const busy = await makeEmployee();
    await assign(busy.id, (await makeVenture()).id);
    actAs(manager.id);
    const r = await call(members.POST, { method: 'POST', params: { ventureId: managerVenture.id }, body: { employeeId: busy.id } });
    assert.equal(r.status, 404);
  });

  test('MANAGER can staff their venture from the unassigned pool', async () => {
    const free = await makeEmployee();
    actAs(manager.id);
    const r = await call(members.POST, { method: 'POST', params: { ventureId: managerVenture.id }, body: { employeeId: free.id, accessLevel: 'OPERATIONS' } });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.data.employee.id, free.id);
  });

  test('MANAGER cannot modify assignments on other ventures', async () => {
    actAs(admin.id);
    const a = await assign((await makeEmployee()).id, (await makeVenture()).id);
    actAs(manager.id);
    assert.equal((await call(assignmentItem.PATCH, { method: 'PATCH', params: { id: a.id }, body: { accessLevel: 'FULL_ACCESS' } })).status, 404);
    assert.equal((await call(assignmentItem.DELETE, { method: 'DELETE', params: { id: a.id } })).status, 404);
  });
});
