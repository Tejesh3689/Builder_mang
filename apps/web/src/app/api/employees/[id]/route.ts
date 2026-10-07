import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireEmployeeInScope } from '@/lib/scope';
import { withCurrentStatus } from '@/lib/validation/certification';
import { employeeUpdateSchema } from '@/lib/validation/employee';
import { terminateEmployee, updateEmployee } from '@/services/employee.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const { id } = await params;
  const employee = await requireEmployeeInScope(user, id, {
    reportingManager: { select: { firstName: true, lastName: true } },
    assignments: { include: { venture: true } },
    skills: true,
    certifications: true,
    documents: true,
  });
  return ok({ ...employee, certifications: employee.certifications.map((c) => withCurrentStatus(c)) });
}, { resource: 'employee', context: 'employee GET' });

// Same resource scope as GET: a MANAGER can only modify employees on their ventures.
export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:edit');
  const { id } = await params;
  const employee = await requireEmployeeInScope(user, id);
  const input = await parseBody(req, employeeUpdateSchema);
  const updated = await updateEmployee(user, employee, input);
  return ok(updated);
}, { resource: 'employee', context: 'employee PATCH' });

/** Termination (soft delete) — see terminate policy in employee.service. */
export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:terminate'); // ADMIN only
  const { id } = await params;
  const employee = await requireEmployeeInScope(user, id);
  const terminated = await terminateEmployee(user, employee);
  return ok(terminated);
}, { resource: 'employee', context: 'employee DELETE' });
