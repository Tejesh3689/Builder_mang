import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { getInTransit } from '@/services/inventory.service';

/** Dispatched-but-not-received quantities per material and destination. */
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  assertPermission(user, 'materials:view');
  return ok(await getInTransit(user));
}, { resource: 'transfer', context: 'transfers in-transit GET' });
