import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { getTransfer } from '@/services/inventory.service';

type Ctx = { params: Promise<{ id: string }> };

// No PUT/PATCH/DELETE: a transfer only changes through dispatch / receive / cancel.
export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:view');
  return ok(await getTransfer(user, (await params).id));
}, { resource: 'transfer', context: 'transfer GET' });
