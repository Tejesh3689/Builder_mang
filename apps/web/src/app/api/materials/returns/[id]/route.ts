import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { getReturn } from '@/services/inventory.service';

type Ctx = { params: Promise<{ id: string }> };

// No PUT/PATCH/DELETE: returns are append-only.
export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:view');
  return ok(await getReturn(user, (await params).id));
}, { resource: 'return', context: 'return GET' });
