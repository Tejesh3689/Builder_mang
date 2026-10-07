import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { requireVentureInScope } from '@/lib/scope';
import { readMultipart } from '@/lib/uploads/multipart';
import { uploadVentureDocument, ventureDocumentVisibility } from '@/services/document.service';

type Ctx = { params: Promise<{ ventureId: string }> };

export const GET = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const documents = await prisma.ventureDocument.findMany({
    where: { ventureId: venture.id, ...ventureDocumentVisibility(user.role) },
    orderBy: { createdAt: 'desc' },
  });
  return ok(documents);
}, { resource: 'document', context: 'venture documents GET' });

/** multipart/form-data: `file` (required), `title`, `category`, `version`, `visibility` (optional). */
export const POST = apiHandler<Ctx>(async (request, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:edit');
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const form = await readMultipart(request);
  const doc = await uploadVentureDocument(user, venture.id, form);
  return created(doc);
}, { resource: 'document', context: 'venture documents POST' });
