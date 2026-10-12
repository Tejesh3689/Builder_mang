import { EmployeeStatus, type Prisma } from '@prisma/client';

/**
 * Filter for active employees: status is NOT TERMINATED.
 * Both ACTIVE and ON_LEAVE employees are included; TERMINATED employees are excluded.
 */
export const activeEmployeeWhere: Prisma.EmployeeWhereInput = {
  status: { not: EmployeeStatus.TERMINATED },
};

/**
 * Filter for active employee relation where clause: e.g. employee: { ...activeEmployeeRelationWhere }
 */
export const activeEmployeeRelationWhere = {
  status: { not: EmployeeStatus.TERMINATED },
};

/**
 * Merges activeEmployeeWhere with any provided EmployeeWhereInput.
 */
export function withActiveEmployeeWhere(where?: Prisma.EmployeeWhereInput): Prisma.EmployeeWhereInput {
  if (!where) return activeEmployeeWhere;
  return {
    AND: [where, activeEmployeeWhere],
  };
}
