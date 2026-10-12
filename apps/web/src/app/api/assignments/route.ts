import { prisma } from '@/lib/db';
import { assertPermission, buildScopedWhere, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { badRequest, notFound } from '@/lib/http/errors';
import { isValidUuid, requireAssignableEmployee, requireVentureInScope } from '@/lib/scope';
import { directAssignmentCreateSchema } from '@/lib/validation/assignment';
import { assignEmployee } from '@/services/assignment.service';
import { activeEmployeeWhere } from '@/lib/employees/scope';

export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employeeId');
  const ventureId = url.searchParams.get('ventureId');

  if (employeeId && !isValidUuid(employeeId)) {
    throw badRequest('Invalid employee id');
  }

  const scopedVentureWhere = await buildScopedWhere(user, 'venture');
  if ((scopedVentureWhere as any).id === 'DENY_ALL') {
    return ok([]);
  }

  const where: any = {
    employee: activeEmployeeWhere,
  };

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (ventureId) {
    await requireVentureInScope(user, ventureId);
    where.ventureId = ventureId;
  } else if ((scopedVentureWhere as any)?.id?.in) {
    where.ventureId = { in: (scopedVentureWhere as any).id.in };
  }

  const assignments = await prisma.employeeVentureAssignment.findMany({
    where,
    include: {
      venture: { select: { id: true, name: true, code: true } },
      employee: { select: { id: true, employeeId: true, firstName: true, lastName: true, designation: true, status: true } },
    },
    orderBy: { startDate: 'desc' },
  });

  return ok(assignments);
}, { resource: 'assignment', context: 'assignments GET' });

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:assign');

  const input = await parseBody(req, directAssignmentCreateSchema);

  if (!isValidUuid(input.employeeId)) {
    throw badRequest('Invalid employee id');
  }

  if (!isValidUuid(input.ventureId)) {
    throw badRequest('Invalid venture id');
  }

  const employee = await requireAssignableEmployee(user, input.employeeId);
  const venture = await requireVentureInScope(user, input.ventureId);

  const assignment = await assignEmployee(user, employee, venture, {
    roleAtSite: input.roleAtSite,
    accessLevel: input.accessLevel,
    startDate: input.startDate,
    reportingManagerId: input.reportingManagerId ?? input.reportingManager,
  });

  return created(assignment);
}, { resource: 'assignment', context: 'assignments POST' });
