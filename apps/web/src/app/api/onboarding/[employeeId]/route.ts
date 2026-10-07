import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertPermission, buildScopedWhere, requireAuth } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireEmployeeInScope } from '@/lib/scope';
import { onboardingUpdateSchema } from '@/lib/validation/employee';
import { updateEmployee } from '@/services/employee.service';

type Ctx = { params: Promise<{ employeeId: string }> };

/** Accepts the employee UUID or the EMP-#### code. */
export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const { employeeId } = await params;
  const scopedWhere = await buildScopedWhere(user, 'employee');
  const employee =
    (scopedWhere as any).id === 'DENY_ALL'
      ? null
      : await prisma.employee.findFirst({
          where: {
            AND: [
              { OR: [{ id: employeeId }, { employeeId: employeeId.toUpperCase() }] },
              scopedWhere as Prisma.EmployeeWhereInput,
            ],
          },
          select: {
            id: true, employeeId: true, firstName: true, lastName: true,
            onboardingStage: true, onboardingStatus: true, designation: true, department: true,
          },
        });
  if (!employee) throw notFound('Employee not found.');
  return ok(employee);
}, { resource: 'employee', context: 'onboarding employee GET' });

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:edit');
  const employee = await requireEmployeeInScope(user, (await params).employeeId);
  const input = await parseBody(req, onboardingUpdateSchema);
  const updated = await updateEmployee(user, employee, input);
  return ok(updated);
}, { resource: 'employee', context: 'onboarding PATCH' });
