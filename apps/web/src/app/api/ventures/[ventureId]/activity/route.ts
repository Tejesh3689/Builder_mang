import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { getPaginationParams } from '@/lib/pagination';
import { requireVentureInScope } from '@/lib/scope';

type Ctx = { params: Promise<{ ventureId: string }> };

export const GET = apiHandler<Ctx>(async (request, { params }) => {
  const user = await requireAuth();
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const { skip, take } = getPaginationParams(request, 50, 200);
  const logs = await prisma.auditLog.findMany({
    where: { ventureId: venture.id },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
  return ok(logs);
}, { resource: 'activity', context: 'venture activity GET' });
