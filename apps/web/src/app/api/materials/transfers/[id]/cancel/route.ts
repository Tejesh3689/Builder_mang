import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { transferCancelSchema } from '@/lib/validation/inventory';
import { cancelTransfer } from '@/services/inventory.service';

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:transfer');
  const { reason } = await parseBody(req, transferCancelSchema);
  return ok(await cancelTransfer(user, (await params).id, reason));
}, { resource: 'transfer', context: 'transfer cancel' });
