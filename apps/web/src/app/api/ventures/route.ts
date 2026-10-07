import { VentureStatus, VentureType, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getPaginationParams } from '@/lib/pagination';
import { assertPermission, buildScopedWhere, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { badRequest } from '@/lib/http/errors';
import { parseBody } from '@/lib/http/request';
import { ventureCreateSchema } from '@/lib/validation/venture';
import { createVenture } from '@/services/venture.service';

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const search = searchParams.get('search')?.trim();
  const location = searchParams.get('location')?.trim();

  const scopedWhere = await buildScopedWhere(user, 'venture');
  if ((scopedWhere as any).id === 'DENY_ALL') return ok([]);

  const and: Prisma.VentureWhereInput[] = [scopedWhere as Prisma.VentureWhereInput];
  if (status && status !== 'ALL') {
    if (!(status in VentureStatus)) throw badRequest('status filter is invalid', 'status');
    and.push({ status: status as VentureStatus });
  }
  if (type && type !== 'ALL') {
    if (!(type in VentureType)) throw badRequest('type filter is invalid', 'type');
    and.push({ type: type as VentureType });
  }
  if (location) {
    and.push({
      OR: [
        { regCity: { contains: location, mode: 'insensitive' } },
        { siteCity: { contains: location, mode: 'insensitive' } },
      ],
    });
  }
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { siteCity: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const { skip, take } = getPaginationParams(request);
  const ventures = await prisma.venture.findMany({
    where: { AND: and },
    skip,
    take,
    include: {
      projectManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
      siteManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
      _count: { select: { assignments: true, stocks: true, documents: true, requests: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok(ventures);
}, { resource: 'venture', context: 'ventures GET' });

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:create');
  const input = await parseBody(request, ventureCreateSchema);
  const venture = await createVenture(user, input);
  return created(venture);
}, { resource: 'venture', context: 'ventures POST' });
