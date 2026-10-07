import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';
import { apiHandler, ok } from '@/lib/http/handler';
import { requireEmployeeInScope } from '@/lib/scope';
import { deleteEmployeeDocument } from '@/services/document.service';

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'documents:edit');
  const doc = await prisma.employeeDocument.findUnique({ where: { id: (await params).id } });
  if (!doc) throw notFound('Document not found');
  await requireEmployeeInScope(user, doc.employeeId).catch(() => {
    throw notFound('Document not found');
  });
  await deleteEmployeeDocument(user, doc);
  return ok({ message: 'Document deleted successfully from vault.' });
}, { resource: 'document', context: 'employee document DELETE' });
