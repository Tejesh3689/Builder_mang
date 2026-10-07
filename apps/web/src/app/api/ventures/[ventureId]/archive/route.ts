import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { requireVentureInScope } from '@/lib/scope';
import { archiveVenture } from '@/services/venture.service';

type Ctx = { params: Promise<{ ventureId: string }> };

export const POST = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:archive');
  const { ventureId } = await params;
  const venture = await requireVentureInScope(user, ventureId);
  const updated = await archiveVenture(user, venture);
  return ok(updated);
}, { resource: 'venture', context: 'venture archive' });
