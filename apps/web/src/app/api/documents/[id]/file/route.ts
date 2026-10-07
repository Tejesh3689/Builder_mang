import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';
import { apiHandler } from '@/lib/http/handler';
import { requireEmployeeInScope } from '@/lib/scope';
import { downloadResponse } from '@/services/document.service';

type Ctx = { params: Promise<{ id: string }> };

/** Authenticated, scope-checked download of an employee document. */
export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const doc = await prisma.employeeDocument.findUnique({ where: { id: (await params).id } });
  if (!doc) throw notFound('Document not found');
  await requireEmployeeInScope(user, doc.employeeId).catch(() => {
    throw notFound('Document not found');
  });
  return downloadResponse(doc);
}, { resource: 'document', context: 'employee document download' });
