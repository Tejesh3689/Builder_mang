import { EmployeeStatus } from '@prisma/client';

/**
 * THE account-usability rule. Login (authorize), token refresh (jwt callback)
 * and every protected API (requireAuth) apply this one function — routes must
 * not re-implement termination / deactivation checks themselves.
 *
 * A user may act in the system only when:
 *  - the User row exists and isActive, and
 *  - its linked Employee (if any) is not TERMINATED.
 */
export interface AccountState {
  isActive: boolean;
  employee?: { status: EmployeeStatus } | null;
}

export function isAccountUsable(user: AccountState | null | undefined): boolean {
  if (!user || !user.isActive) return false;
  if (user.employee?.status === EmployeeStatus.TERMINATED) return false;
  return true;
}

/** Prisma `select` fragment that loads exactly what isAccountUsable needs. */
export const accountStateSelect = {
  isActive: true,
  employee: { select: { status: true } },
} as const;
