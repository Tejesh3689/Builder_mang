import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireVentureInScope } from '@/lib/scope';
import { assignmentUpdateSchema } from '@/lib/validation/assignment';
import { removeAssignment, updateAssignment } from '@/services/assignment.service';

type Ctx = { params: Promise<{ id: string }> };

/** Loads the assignment and checks the actor has its venture in scope (404 otherwise). */
async function loadInScope(user: Awaited<ReturnType<typeof requireAuth>>, id: string) {
  const assignment = await prisma.employeeVentureAssignment.findUnique({ where: { id } });
  if (!assignment) throw notFound('Assignment not found');
  await requireVentureInScope(user, assignment.ventureId).catch(() => {
    throw notFound('Assignment not found');
  });
  return assignment;
}

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:assign');
  const assignment = await loadInScope(user, (await params).id);
  const input = await parseBody(req, assignmentUpdateSchema);
  const updated = await updateAssignment(user, assignment, input);
  return ok(updated);
}, { resource: 'assignment', context: 'assignment PATCH' });

export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:assign');
  const assignment = await loadInScope(user, (await params).id);
  await removeAssignment(user, assignment);
  return ok({ message: 'Assignment deleted successfully.' });
}, { resource: 'assignment', context: 'assignment DELETE' });
