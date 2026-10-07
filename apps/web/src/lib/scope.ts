import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { buildScopedWhere } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';

/**
 * Resource-level scope checks. Every route that touches a single venture or
 * employee resolves it through these helpers, so a MANAGER/SUPERVISOR can only
 * reach records inside their assignment scope. Out-of-scope records are reported
 * as 404 (same as missing) so their existence is not leaked.
 */

type ScopedUser = Parameters<typeof buildScopedWhere>[0];

async function scopedWhere(user: ScopedUser, resource: 'venture' | 'employee') {
  const where = await buildScopedWhere(user, resource);
  return (where as any).id === 'DENY_ALL' ? null : where;
}

/** Resolves a venture by id or code within the user's scope, or throws 404. */
export async function requireVentureInScope<I extends Prisma.VentureInclude | undefined = undefined>(
  user: ScopedUser,
  idOrCode: string,
  include?: I
) {
  const where = await scopedWhere(user, 'venture');
  const venture = where
    ? await prisma.venture.findFirst({
        where: { AND: [{ OR: [{ id: idOrCode }, { code: idOrCode }] }, where as Prisma.VentureWhereInput] },
        include,
      })
    : null;
  if (!venture) throw notFound('Venture not found');
  return venture as Prisma.VentureGetPayload<{ include: I }>;
}

/** Resolves an employee by id within the user's scope, or throws 404. */
export async function requireEmployeeInScope<I extends Prisma.EmployeeInclude | undefined = undefined>(
  user: ScopedUser,
  id: string,
  include?: I
) {
  const where = await scopedWhere(user, 'employee');
  const employee = where
    ? await prisma.employee.findFirst({
        where: { AND: [{ id }, where as Prisma.EmployeeWhereInput] },
        include,
      })
    : null;
  if (!employee) throw notFound('Employee not found');
  return employee as Prisma.EmployeeGetPayload<{ include: I }>;
}

/**
 * An employee the user may assign to a venture: either already in the user's
 * employee scope, or currently unassigned (no ACTIVE assignment). This lets a
 * MANAGER staff their venture from the unassigned pool without being able to
 * pull people off ventures they do not manage.
 */
export async function requireAssignableEmployee(user: ScopedUser, id: string) {
  try {
    return await requireEmployeeInScope(user, id);
  } catch (e) {
    const unassigned = await prisma.employee.findFirst({
      where: { id, assignments: { none: { status: 'ACTIVE' } } },
    });
    if (!unassigned) throw e;
    return unassigned;
  }
}
