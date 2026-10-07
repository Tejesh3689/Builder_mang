import { EmployeeStatus, type Prisma } from '@prisma/client';
import { badRequest } from '@/lib/http/errors';

type Db = Pick<Prisma.TransactionClient, 'employee'>;

export interface EmployeeRef {
  /** Body field the id came from — used in the error message / `field`. */
  field: string;
  id: string;
}

export interface EligibilityOptions {
  /**
   * Leaders must be able to log in to act in the role, so a linked active User is required.
   * Reporting managers only need to be non-terminated and not deactivated.
   */
  requireLogin: boolean;
}

/**
 * The single rule for "may this employee be put in charge of something"
 * (venture leadership roles, reporting manager). Throws a 400 naming the field.
 */
export async function assertEmployeesEligible(db: Db, refs: EmployeeRef[], opts: EligibilityOptions): Promise<void> {
  if (refs.length === 0) return;

  const employees = await db.employee.findMany({
    where: { id: { in: [...new Set(refs.map((r) => r.id))] } },
    select: { id: true, status: true, user: { select: { isActive: true } } },
  });
  const byId = new Map(employees.map((e) => [e.id, e]));

  for (const { field, id } of refs) {
    const emp = byId.get(id);
    if (!emp) throw badRequest(`${field}: employee does not exist`, field);
    if (emp.status === EmployeeStatus.TERMINATED) throw badRequest(`${field}: employee is terminated`, field);
    if (emp.user && !emp.user.isActive) throw badRequest(`${field}: employee's user account is inactive`, field);
    if (opts.requireLogin && !emp.user) {
      throw badRequest(`${field}: employee has no user account and cannot act as a leader`, field);
    }
  }
}
