import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { getPaginationParams } from '@/lib/pagination';
import { returnCreateSchema } from '@/lib/validation/inventory';
import { createReturn, listReturns } from '@/services/inventory.service';

export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:view');
  const sourceIssueId = new URL(req.url).searchParams.get('sourceIssueId') ?? undefined;
  return ok(await listReturns(user, { sourceIssueId, ...getPaginationParams(req) }));
}, { resource: 'return', context: 'returns GET' });

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'materials:return');
  const input = await parseBody(req, returnCreateSchema);
  const { materialReturn, replayed } = await createReturn(user, input);
  return replayed ? ok(materialReturn) : created(materialReturn);
}, { resource: 'return', context: 'returns POST' });
