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

/** Accepts the employee primary key UUID. */
export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const { employeeId } = await params;
  const employee = await requireEmployeeInScope(user, employeeId);
  return ok({
    id: employee.id,
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    onboardingStage: employee.onboardingStage,
    onboardingStatus: employee.onboardingStatus,
    designation: employee.designation,
    department: employee.department,
  });
}, { resource: 'employee', context: 'onboarding employee GET' });

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:edit');
  const employee = await requireEmployeeInScope(user, (await params).employeeId);
  const input = await parseBody(req, onboardingUpdateSchema);
  const updated = await updateEmployee(user, employee, input);
  return ok(updated);
}, { resource: 'employee', context: 'onboarding PATCH' });
