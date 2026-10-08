import { EmployeeStatus, LeaveStatus, Prisma, VentureStatus, type Employee } from '@prisma/client';
import { prisma } from '@/lib/db';
import { badRequest, conflict, forbidden } from '@/lib/http/errors';
import { diffFields, recordAudit } from '@/lib/audit';
import { assertEmployeesEligible } from '@/lib/policies/employeeEligibility';
import {
  joiningDateColumn,
  normalizeEmail,
  normalizePhone,
  type EmployeeCreateInput,
  type EmployeeUpdateInput,
} from '@/lib/validation/employee';

type Tx = Prisma.TransactionClient;
type Actor = { id: string; role: string };

const AUDITED_EMPLOYEE_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'designation', 'department', 'status',
  'joiningDate', 'reportingManagerId', 'employmentType', 'onboardingStage', 'onboardingStatus',
] as const;

/** Ventures that are still running — leadership of these blocks termination. */
const OPEN_VENTURE_STATUSES = [VentureStatus.DRAFT, VentureStatus.PLANNING, VentureStatus.ACTIVE, VentureStatus.ON_HOLD];

// ---------------------------------------------------------------------------
// Locks (transaction-scoped, released on commit/rollback)
// ---------------------------------------------------------------------------

async function lock(tx: Tx, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

// ---------------------------------------------------------------------------
// Uniqueness
// ---------------------------------------------------------------------------

/**
 * Rejects an email / phone already used by another employee. Comparison is on
 * normalised values (case-insensitive email; digits-only phone, bare 10-digit
 * numbers treated as +91) so legacy rows stored in other formats still match.
 * Runs under advisory locks so two concurrent requests cannot both pass.
 */
export async function assertUniqueContact(tx: Tx, contact: { email?: string | null; phone?: string | null }, excludeId?: string) {
  const email = contact.email ? normalizeEmail(contact.email) : null;
  const phone = contact.phone ? normalizePhone(contact.phone) : null;
  if (email) await lock(tx, `employee-email:${email}`);
  if (phone) await lock(tx, `employee-phone:${phone}`);

  if (email) {
    const clash = await tx.employee.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (clash) throw conflict('An employee with this email already exists.', { field: 'email' });

    // A login account with this email that belongs to someone else (not this employee's own user).
    const userClash = await tx.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        ...(excludeId ? { OR: [{ employee: null }, { employee: { id: { not: excludeId } } }] } : {}),
      },
      select: { id: true },
    });
    if (userClash) throw conflict('A user account with this email already exists.', { field: 'email' });
  }
  if (phone) {
    const digits = phone.slice(1);
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM employees
      WHERE phone IS NOT NULL
        AND (${excludeId ?? null}::text IS NULL OR id <> ${excludeId ?? null}::text)
        AND (
          CASE
            WHEN length(regexp_replace(phone, '[^0-9]', '', 'g')) = 10 THEN '91' || regexp_replace(phone, '[^0-9]', '', 'g')
            WHEN length(regexp_replace(phone, '[^0-9]', '', 'g')) = 11 AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE '0%'
              THEN '91' || substr(regexp_replace(phone, '[^0-9]', '', 'g'), 2)
            ELSE regexp_replace(phone, '[^0-9]', '', 'g')
          END
        ) = ${digits}
      LIMIT 1`;
    if (rows.length) throw conflict('An employee with this phone number already exists.', { field: 'phone' });
  }
}

// ---------------------------------------------------------------------------
// Reporting hierarchy
// ---------------------------------------------------------------------------

/**
 * Walks the proposed manager's chain upwards; rejects self-reference and any
 * cycle (2-cycle, 3-cycle, arbitrary length). Must run under the hierarchy lock.
 */
export async function assertNoManagerCycle(tx: Tx, employeeId: string, managerId: string) {
  if (managerId === employeeId) throw badRequest('reportingManagerId: an employee cannot report to themselves', 'reportingManagerId');

  const seen = new Set<string>();
  let current: string | null = managerId;
  while (current) {
    if (current === employeeId) {
      throw badRequest('reportingManagerId: this would create a circular reporting chain', 'reportingManagerId');
    }
    if (seen.has(current)) break; // pre-existing cycle above us that does not include this employee
    seen.add(current);
    const next: { reportingManagerId: string | null } | null = await tx.employee.findUnique({
      where: { id: current },
      select: { reportingManagerId: true },
    });
    current = next?.reportingManagerId ?? null;
  }
}

/** Validates a new reporting manager (eligibility + hierarchy). */
async function assertManagerAssignable(tx: Tx, employeeId: string | null, managerId: string) {
  await assertEmployeesEligible(tx, [{ field: 'reportingManagerId', id: managerId }], { requireLogin: false });
  await lock(tx, 'employee-hierarchy');
  if (employeeId) await assertNoManagerCycle(tx, employeeId, managerId);
}

/** Changes an employee's reporting manager with all hierarchy rules applied. */
export async function setReportingManager(tx: Tx, employeeId: string, managerId: string | null) {
  if (managerId) await assertManagerAssignable(tx, employeeId, managerId);
  await tx.employee.update({ where: { id: employeeId }, data: { reportingManagerId: managerId } });
}

// ---------------------------------------------------------------------------
// Employee code
// ---------------------------------------------------------------------------

/** Next EMP-#### code. Serialised by a lock; based on the highest existing number, not a row count. */
export async function nextEmployeeCode(tx: Tx): Promise<string> {
  await lock(tx, 'employee-code');
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT max(substring("employeeId" from '^EMP-(\\d+)$')::int) AS max FROM employees`;
  const next = Math.max((rows[0]?.max ?? 999) + 1, 1000);
  return `EMP-${String(next).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------

export async function createEmployee(actor: Actor, input: EmployeeCreateInput) {
  const { ventureId, joiningDate, ...fields } = input;

  return prisma.$transaction(async (tx) => {
    await assertUniqueContact(tx, fields);
    if (fields.reportingManagerId) await assertManagerAssignable(tx, null, fields.reportingManagerId);

    if (ventureId) {
      const venture = await tx.venture.findUnique({ where: { id: ventureId }, select: { status: true } });
      if (!venture) throw badRequest('ventureId: venture does not exist', 'ventureId');
      if (!OPEN_VENTURE_STATUSES.includes(venture.status as (typeof OPEN_VENTURE_STATUSES)[number])) {
        throw conflict('Cannot assign an employee to a closed or archived venture.');
      }
    }

    const employee = await tx.employee.create({
      data: {
        ...fields,
        lastName: fields.lastName ?? '',
        employeeId: await nextEmployeeCode(tx),
        joiningDate: joiningDateColumn(joiningDate) ?? new Date().toISOString().slice(0, 10),
        ...(ventureId
          ? { assignments: { create: { ventureId, roleAtSite: fields.designation, status: 'ACTIVE' } } }
          : {}),
      },
      include: { assignments: { include: { venture: true } } },
    });

    await recordAudit(tx, {
      userId: actor.id,
      action: 'CREATE_EMPLOYEE',
      ventureId: ventureId ?? null,
      details: { employeeId: employee.id, code: employee.employeeId },
    });
    return employee;
  });
}

export async function updateEmployee(actor: Actor, existing: Employee, input: EmployeeUpdateInput) {
  const { status, joiningDate, reportingManagerId, ...fields } = input;
  const terminating = status === EmployeeStatus.TERMINATED && existing.status !== EmployeeStatus.TERMINATED;
  const reactivating = !!status && status !== EmployeeStatus.TERMINATED && existing.status === EmployeeStatus.TERMINATED;

  // Termination / reactivation is an ADMIN lifecycle operation, same as DELETE.
  if ((terminating || reactivating) && actor.role !== 'ADMIN') {
    throw forbidden('Only an administrator can terminate or reactivate an employee');
  }
  if (existing.status === EmployeeStatus.TERMINATED && !reactivating && Object.values(input).some((v) => v !== undefined)) {
    throw conflict('This employee is terminated. Reactivate them before making other changes.');
  }

  return prisma.$transaction(async (tx) => {
    const emailChanged = fields.email !== undefined && fields.email !== (existing.email ? normalizeEmail(existing.email) : null);
    const phoneChanged = fields.phone !== undefined && fields.phone !== existing.phone;
    if (emailChanged || phoneChanged) {
      await assertUniqueContact(
        tx,
        { email: emailChanged ? fields.email : null, phone: phoneChanged ? fields.phone : null },
        existing.id
      );
    }
    if (reportingManagerId !== undefined && reportingManagerId !== existing.reportingManagerId) {
      await setReportingManager(tx, existing.id, reportingManagerId);
    }

    const data = {
      ...fields,
      joiningDate: joiningDateColumn(joiningDate),
      ...(status && !terminating ? { status } : {}),
    };
    let updated = await tx.employee.update({ where: { id: existing.id }, data });

    if (terminating) updated = await terminateInTx(tx, actor, updated);
    // Reactivation restores the login that termination disabled (sessions stay revoked).
    if (reactivating && existing.userId) await tx.user.update({ where: { id: existing.userId }, data: { isActive: true } });

    const changes = diffFields(existing as unknown as Record<string, unknown>, { ...data, reportingManagerId, status }, AUDITED_EMPLOYEE_FIELDS);
    if (Object.keys(changes).length && !terminating) {
      await recordAudit(tx, { userId: actor.id, action: 'UPDATE_EMPLOYEE', details: { employeeId: existing.id, changes } });
    }
    return updated;
  });
}

// ---------------------------------------------------------------------------
// Termination lifecycle
// ---------------------------------------------------------------------------

/**
 * Termination policy (explicit):
 *  BLOCKED (409) while the employee
 *   - leads any open venture (director / PM / site / construction / finance / purchase manager), or
 *   - is the reporting manager of any non-terminated employee.
 *   These need a human decision about who takes over, so they are never auto-reassigned.
 *  AUTOMATIC on termination
 *   - Employee.status = TERMINATED
 *   - every ACTIVE venture assignment -> COMPLETED with endDate = now
 *   - PENDING leave requests -> CANCELLED
 *   - linked User: isActive = false and sessionVersion + 1 (kills existing sessions immediately)
 *  The account policy (lib/policies/account.ts) then rejects the user everywhere,
 *  and the eligibility policy stops them being picked as a leader or manager.
 *  Not touched: material requests / issues (owned by the materials module).
 */
async function terminateInTx(tx: Tx, actor: Actor, employee: Employee) {
  const [ledVentures, activeReports] = await Promise.all([
    tx.venture.findMany({
      where: {
        status: { in: OPEN_VENTURE_STATUSES },
        OR: [
          { projectDirectorId: employee.id }, { projectManagerId: employee.id }, { siteManagerId: employee.id },
          { constructionManagerId: employee.id }, { financeManagerId: employee.id }, { purchaseManagerId: employee.id },
        ],
      },
      select: { id: true, code: true, name: true },
    }),
    tx.employee.count({ where: { reportingManagerId: employee.id, status: { not: EmployeeStatus.TERMINATED } } }),
  ]);
  if (ledVentures.length) {
    throw conflict('Employee leads open ventures. Reassign venture leadership before terminating.', {
      ventures: ledVentures.map((v) => v.code),
    });
  }
  if (activeReports) {
    throw conflict('Employee is the reporting manager of active employees. Reassign their reports before terminating.', {
      activeReports,
    });
  }

  const now = new Date();
  const updated = await tx.employee.update({ where: { id: employee.id }, data: { status: EmployeeStatus.TERMINATED } });
  const endedAssignments = await tx.employeeVentureAssignment.updateMany({
    where: { employeeId: employee.id, status: 'ACTIVE' },
    data: { status: 'COMPLETED', endDate: now },
  });
  const cancelledLeaves = await tx.leaveRequest.updateMany({
    where: { employeeId: employee.id, status: LeaveStatus.PENDING },
    data: { status: LeaveStatus.CANCELLED },
  });
  if (employee.userId) {
    await tx.user.update({
      where: { id: employee.userId },
      data: { isActive: false, sessionVersion: { increment: 1 } },
    });
  }

  await recordAudit(tx, {
    userId: actor.id,
    action: 'TERMINATE_EMPLOYEE',
    details: {
      employeeId: employee.id,
      previousStatus: employee.status,
      endedAssignments: endedAssignments.count,
      cancelledLeaveRequests: cancelledLeaves.count,
      userDeactivated: !!employee.userId,
    },
  });
  return updated;
}

export async function terminateEmployee(actor: Actor, employee: Employee) {
  if (employee.status === EmployeeStatus.TERMINATED) throw conflict('Employee is already terminated.');
  return prisma.$transaction((tx) => terminateInTx(tx, actor, employee));
}
