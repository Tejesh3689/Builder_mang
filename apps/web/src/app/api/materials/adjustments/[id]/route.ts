import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { getAdjustment } from '@/services/inventory.service';

type Ctx = { params: Promise<{ id: string }> };

// No PUT/PATCH/DELETE: adjustments are append-only; a correction is another adjustment.
export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:view');
  return ok(await getAdjustment(user, (await params).id));
}, { resource: 'adjustment', context: 'adjustment GET' });
