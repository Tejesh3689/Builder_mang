import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertPermission, buildScopedWhere, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';

export const GET = apiHandler(async () => {
  const user = await requireAuth();
  assertPermission(user, 'employees:view');
  const scopedWhere = await buildScopedWhere(user, 'employee');
  if ((scopedWhere as any).id === 'DENY_ALL') return ok([]);

  const candidates = await prisma.employee.findMany({
    where: { AND: [scopedWhere as Prisma.EmployeeWhereInput, { NOT: { onboardingStage: 'Active' } }] },
    orderBy: { createdAt: 'desc' },
  });
  return ok(candidates);
}, { resource: 'employee', context: 'onboarding GET' });
