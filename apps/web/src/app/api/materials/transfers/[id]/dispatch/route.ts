import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { dispatchTransfer } from '@/services/inventory.service';

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:transfer');
  return ok(await dispatchTransfer(user, (await params).id));
}, { resource: 'transfer', context: 'transfer dispatch' });
