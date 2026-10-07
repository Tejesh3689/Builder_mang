import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { conflict } from '@/lib/http/errors';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { requireEmployeeInScope } from '@/lib/scope';
import { readMultipart } from '@/lib/uploads/multipart';
import { uploadEmployeeDocument } from '@/services/document.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const employee = await requireEmployeeInScope(user, (await params).id);
  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
  });
  return ok(documents);
}, { resource: 'document', context: 'employee documents GET' });

/** multipart/form-data: `file` (required), `name` (optional display title). */
export const POST = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'documents:edit');
  const employee = await requireEmployeeInScope(user, (await params).id);
  if (employee.status === 'TERMINATED') throw conflict('Cannot upload documents for a terminated employee.');
  const form = await readMultipart(req);
  const doc = await uploadEmployeeDocument(user, employee.id, form);
  return created(doc);
}, { resource: 'document', context: 'employee documents POST' });
