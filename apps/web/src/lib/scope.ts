import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { buildScopedWhere } from '@/lib/authorization';
import { badRequest, notFound } from '@/lib/http/errors';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): boolean {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

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

/** Resolves an employee by primary key id (UUID) within the user's scope, or throws 400/404. */
export async function requireEmployeeInScope<I extends Prisma.EmployeeInclude | undefined = undefined>(
  user: ScopedUser,
  id: string,
  include?: I
) {
  if (!id || !isValidUuid(id)) {
    throw badRequest('Invalid employee id', 'id');
  }
  const cleanId = id.trim();
  const where = await scopedWhere(user, 'employee');
  const employee = where
    ? await prisma.employee.findFirst({
        where: { AND: [{ id: cleanId }, where as Prisma.EmployeeWhereInput] },
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
  if (!id || !isValidUuid(id)) {
    throw badRequest('Invalid employee id', 'id');
  }
  const cleanId = id.trim();
  try {
    return await requireEmployeeInScope(user, cleanId);
  } catch (e: any) {
    if (e?.status === 400) throw e;
    const unassigned = await prisma.employee.findFirst({
      where: { id: cleanId, assignments: { none: { status: 'ACTIVE' } } },
    });
    if (!unassigned) throw notFound('Employee not found');
    return unassigned;
  }
}
