import { EmployeeStatus, VentureStatus, type Employee, type EmployeeVentureAssignment, type Prisma, type Venture } from '@prisma/client';
import { prisma } from '@/lib/db';
import { badRequest, conflict } from '@/lib/http/errors';
import { diffFields, recordAudit } from '@/lib/audit';
import { LEADER_FIELDS } from '@/lib/validation/venture';
import type { AssignmentUpdateInput } from '@/lib/validation/assignment';
import { setReportingManager } from './employee.service';

type Tx = Prisma.TransactionClient;
type Actor = { id: string };

const OPEN_VENTURE_STATUSES: VentureStatus[] = [VentureStatus.DRAFT, VentureStatus.PLANNING, VentureStatus.ACTIVE, VentureStatus.ON_HOLD];

/**
 * Assignment policy (explicit):
 *  - An employee has at most ONE active venture assignment. Assigning to a new
 *    venture completes the current one (existing product behaviour).
 *  - Assigning to a venture the employee is already actively assigned to -> 409.
 *  - A past (COMPLETED) assignment to the same venture is reactivated, since
 *    (employeeId, ventureId) is unique.
 *  - An assignment cannot be ended/removed while the employee is a leader of that
 *    venture (would leave a leader who is not on the venture) -> 409.
 *  - Terminated employees and closed/archived ventures cannot be assigned -> 409.
 */

async function lockEmployee(tx: Tx, employeeId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`assignment:${employeeId}`}))`;
}

/** Throws 409 if the employee holds a leadership role on the venture. */
async function assertNotVentureLeader(tx: Tx, employeeId: string, ventureId: string) {
  const venture = await tx.venture.findUnique({
    where: { id: ventureId },
    select: Object.fromEntries(LEADER_FIELDS.map((f) => [f, true])) as Record<(typeof LEADER_FIELDS)[number], true>,
  });
  const roles = venture ? LEADER_FIELDS.filter((f) => (venture as Record<string, string | null>)[f] === employeeId) : [];
  if (roles.length) {
    throw conflict('Employee is a leader of this venture. Reassign the leadership role before ending this assignment.', { roles });
  }
}

export async function assignEmployee(
  actor: Actor,
  employee: Employee,
  venture: Venture,
  input: { roleAtSite?: string | null; accessLevel: string; startDate?: Date | null; reportingManagerId?: string | null }
) {
  if (employee.status === EmployeeStatus.TERMINATED) throw conflict('A terminated employee cannot be assigned to a venture.');
  if (!OPEN_VENTURE_STATUSES.includes(venture.status)) throw conflict('Cannot assign an employee to a closed or archived venture.');

  return prisma.$transaction(async (tx) => {
    await lockEmployee(tx, employee.id);

    const existing = await tx.employeeVentureAssignment.findUnique({
      where: { employeeId_ventureId: { employeeId: employee.id, ventureId: venture.id } },
    });
    if (existing?.status === 'ACTIVE') throw conflict('Employee is already assigned to this venture.');

    // Single-active-assignment policy: complete the current one(s) first.
    const current = await tx.employeeVentureAssignment.findMany({
      where: { employeeId: employee.id, status: 'ACTIVE' },
      select: { id: true, ventureId: true },
    });
    for (const a of current) await assertNotVentureLeader(tx, employee.id, a.ventureId);
    const now = new Date();
    if (current.length) {
      await tx.employeeVentureAssignment.updateMany({
        where: { id: { in: current.map((a) => a.id) } },
        data: { status: 'COMPLETED', endDate: now },
      });
    }

    const data = {
      roleAtSite: input.roleAtSite ?? null,
      accessLevel: input.accessLevel,
      startDate: input.startDate ?? now,
      endDate: null,
      status: 'ACTIVE',
    };
    const assignment = existing
      ? await tx.employeeVentureAssignment.update({ where: { id: existing.id }, data, include: { venture: true } })
      : await tx.employeeVentureAssignment.create({
          data: { ...data, employeeId: employee.id, ventureId: venture.id },
          include: { venture: true },
        });

    if (input.reportingManagerId) await setReportingManager(tx, employee.id, input.reportingManagerId);

    await recordAudit(tx, {
      userId: actor.id,
      action: 'ASSIGN_EMPLOYEE',
      ventureId: venture.id,
      details: {
        employeeId: employee.id,
        assignmentId: assignment.id,
        accessLevel: assignment.accessLevel,
        completedAssignments: current.map((a) => a.id),
        reactivated: !!existing,
      },
    });
    return assignment;
  });
}

export async function updateAssignment(actor: Actor, assignment: EmployeeVentureAssignment, input: AssignmentUpdateInput) {
  const ending = (input.status === 'COMPLETED' && assignment.status === 'ACTIVE') || (input.endDate && assignment.status === 'ACTIVE');
  const reactivating = input.status === 'ACTIVE' && assignment.status !== 'ACTIVE';
  if (input.endDate && input.endDate < assignment.startDate) {
    throw badRequest('endDate cannot be before the assignment startDate', 'endDate');
  }
  // When ending without an explicit date, never stamp an endDate earlier than the start
  // (startDate may be in the future, or a few ms "ahead" of this server's clock).
  const autoEnd = () => new Date(Math.max(Date.now(), assignment.startDate.getTime()));
  const endDate = input.endDate !== undefined ? input.endDate : ending ? autoEnd() : undefined;

  return prisma.$transaction(async (tx) => {
    await lockEmployee(tx, assignment.employeeId);
    if (ending) await assertNotVentureLeader(tx, assignment.employeeId, assignment.ventureId);
    if (reactivating) {
      const [employee, otherActive] = await Promise.all([
        tx.employee.findUnique({ where: { id: assignment.employeeId }, select: { status: true } }),
        tx.employeeVentureAssignment.count({ where: { employeeId: assignment.employeeId, status: 'ACTIVE', id: { not: assignment.id } } }),
      ]);
      if (employee?.status === EmployeeStatus.TERMINATED) throw conflict('A terminated employee cannot be reactivated on a venture.');
      if (otherActive) throw conflict('Employee already has an active assignment. End it before reactivating this one.');
    }

    const data = {
      accessLevel: input.accessLevel,
      roleAtSite: input.roleAtSite,
      status: input.status ?? (ending ? 'COMPLETED' : undefined),
      endDate: reactivating ? null : endDate,
    };
    const updated = await tx.employeeVentureAssignment.update({ where: { id: assignment.id }, data });

    const changes = diffFields(assignment as unknown as Record<string, unknown>, data, ['accessLevel', 'roleAtSite', 'status', 'endDate']);
    if (Object.keys(changes).length) {
      await recordAudit(tx, {
        userId: actor.id,
        action: 'UPDATE_ASSIGNMENT',
        ventureId: assignment.ventureId,
        details: { assignmentId: assignment.id, employeeId: assignment.employeeId, changes },
      });
    }
    return updated;
  });
}

export async function removeAssignment(actor: Actor, assignment: EmployeeVentureAssignment) {
  await prisma.$transaction(async (tx) => {
    await lockEmployee(tx, assignment.employeeId);
    if (assignment.status === 'ACTIVE') await assertNotVentureLeader(tx, assignment.employeeId, assignment.ventureId);
    await tx.employeeVentureAssignment.delete({ where: { id: assignment.id } });
    await recordAudit(tx, {
      userId: actor.id,
      action: 'REMOVE_ASSIGNMENT',
      ventureId: assignment.ventureId,
      details: { assignmentId: assignment.id, employeeId: assignment.employeeId, status: assignment.status },
    });
  });
}
