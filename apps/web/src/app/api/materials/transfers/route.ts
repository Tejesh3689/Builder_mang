import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { getPaginationParams } from '@/lib/pagination';
import { transferCreateSchema } from '@/lib/validation/inventory';
import { createTransfer, listTransfers } from '@/services/inventory.service';

export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:view');
  const status = new URL(req.url).searchParams.get('status') ?? undefined;
  return ok(await listTransfers(user, { status, ...getPaginationParams(req) }));
}, { resource: 'transfer', context: 'transfers GET' });

/** Creates a DRAFT transfer. Server-controlled fields (status, dates, actors) are rejected by the strict schema. */
export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:transfer');
  const input = await parseBody(req, transferCreateSchema);
  const { transfer, replayed } = await createTransfer(user, input);
  return replayed ? ok(transfer) : created(transfer);
}, { resource: 'transfer', context: 'transfers POST' });
