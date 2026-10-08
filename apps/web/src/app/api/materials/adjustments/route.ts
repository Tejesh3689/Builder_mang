import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { getPaginationParams } from '@/lib/pagination';
import { adjustmentCreateSchema } from '@/lib/validation/inventory';
import { createAdjustment, listAdjustments } from '@/services/inventory.service';

export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:view');
  const stockLocationId = new URL(req.url).searchParams.get('stockLocationId') ?? undefined;
  return ok(await listAdjustments(user, { stockLocationId, ...getPaginationParams(req) }));
}, { resource: 'adjustment', context: 'adjustments GET' });

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:adjust');
  const input = await parseBody(req, adjustmentCreateSchema);
  const { adjustment, replayed } = await createAdjustment(user, input);
  return replayed ? ok(adjustment) : created(adjustment);
}, { resource: 'adjustment', context: 'adjustments POST' });
