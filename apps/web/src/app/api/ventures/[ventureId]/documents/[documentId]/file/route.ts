import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';
import { apiHandler } from '@/lib/http/handler';
import { requireVentureInScope } from '@/lib/scope';
import { downloadResponse, ventureDocumentVisibility } from '@/services/document.service';

type Ctx = { params: Promise<{ ventureId: string; documentId: string }> };

/** Authenticated, scope- and visibility-checked download of a venture document. */
export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const { ventureId, documentId } = await params;
  const venture = await requireVentureInScope(user, ventureId);
  const doc = await prisma.ventureDocument.findFirst({
    where: { id: documentId, ventureId: venture.id, ...ventureDocumentVisibility(user.role) },
  });
  if (!doc) throw notFound('Document not found');
  return downloadResponse({ ...doc, name: doc.title, mimeType: doc.fileType });
}, { resource: 'document', context: 'venture document download' });
