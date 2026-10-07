import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireAssignableEmployee, requireVentureInScope } from '@/lib/scope';
import { memberCreateSchema } from '@/lib/validation/assignment';
import { assignEmployee } from '@/services/assignment.service';

type Ctx = { params: Promise<{ ventureId: string }> };

export const GET = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const assignments = await prisma.employeeVentureAssignment.findMany({
    where: { ventureId: venture.id },
    include: { employee: true },
  });
  return ok(assignments);
}, { resource: 'member', context: 'venture members GET' });

export const POST = apiHandler<Ctx>(async (request, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:edit');
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const input = await parseBody(request, memberCreateSchema);
  const employee = await requireAssignableEmployee(user, input.employeeId);
  const assignment = await assignEmployee(user, employee, venture, input);
  const withEmployee = await prisma.employeeVentureAssignment.findUniqueOrThrow({
    where: { id: assignment.id },
    include: { employee: true },
  });
  return created(withEmployee);
}, { resource: 'member', context: 'venture members POST' });
