import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireAssignableEmployee, requireEmployeeInScope, requireVentureInScope } from '@/lib/scope';
import { assignmentCreateSchema } from '@/lib/validation/assignment';
import { assignEmployee } from '@/services/assignment.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const employee = await requireEmployeeInScope(user, (await params).id);
  const assignments = await prisma.employeeVentureAssignment.findMany({
    where: { employeeId: employee.id },
    include: { venture: { select: { id: true, name: true, code: true } } },
    orderBy: { startDate: 'desc' },
  });
  return ok(assignments);
}, { resource: 'assignment', context: 'employee assignments GET' });

export const POST = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:assign');
  const employee = await requireAssignableEmployee(user, (await params).id);
  const input = await parseBody(req, assignmentCreateSchema);
  // The actor must also have the target venture in scope.
  const venture = await requireVentureInScope(user, input.ventureId);
  const assignment = await assignEmployee(user, employee, venture, {
    roleAtSite: input.roleAtSite,
    accessLevel: input.accessLevel,
    startDate: input.startDate,
    reportingManagerId: input.reportingManagerId ?? input.reportingManager,
  });
  return created(assignment);
}, { resource: 'assignment', context: 'employee assignments POST' });
