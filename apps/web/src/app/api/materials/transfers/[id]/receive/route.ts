import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { transferReceiveSchema } from '@/lib/validation/inventory';
import { receiveTransfer } from '@/services/inventory.service';

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:transfer');
  const input = await parseBody(req, transferReceiveSchema);
  return ok(await receiveTransfer(user, (await params).id, input));
}, { resource: 'transfer', context: 'transfer receive' });
