import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { requireVentureInScope } from '@/lib/scope';

type Ctx = { params: Promise<{ ventureId: string }> };

// Venture-scoped read: every role (including those with materials:stock) is limited
// to ventures in their assignment scope; ADMIN sees all.
export const GET = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const stocks = await prisma.materialStock.findMany({
    where: { ventureId: venture.id },
    include: { material: { include: { category: true, unitOfMeasure: true } } },
  });
  return ok(stocks);
}, { resource: 'material stock', context: 'venture materials GET' });
