import { NextResponse } from 'next/server';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireVentureInScope } from '@/lib/scope';
import { ventureUpdateSchema } from '@/lib/validation/venture';
import { deleteVenture, updateVenture } from '@/services/venture.service';
import { ventureDocumentVisibility } from '@/services/document.service';

type Ctx = { params: Promise<{ ventureId: string }> };

const leaderSelect = { select: { id: true, firstName: true, lastName: true, designation: true } };

export const GET = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  const { ventureId } = await params;
  const venture = await requireVentureInScope(user, ventureId, {
    projectDirector: leaderSelect,
    projectManager: leaderSelect,
    siteManager: leaderSelect,
    constructionManager: leaderSelect,
    financeManager: leaderSelect,
    purchaseManager: leaderSelect,
    assignments: { include: { employee: true } },
    stocks: { include: { material: { include: { category: true, unitOfMeasure: true } } } },
    documents: { where: ventureDocumentVisibility(user.role) },
    announcements: { orderBy: { createdAt: 'desc' } },
    chatRooms: true,
    settings: true,
    requests: { select: { status: true } },
    auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
  });
  return ok(venture);
}, { resource: 'venture', context: 'venture GET' });

export const PATCH = apiHandler<Ctx>(async (request, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:edit');
  const { ventureId } = await params;
  const venture = await requireVentureInScope(user, ventureId);
  const input = await parseBody(request, ventureUpdateSchema);
  const updated = await updateVenture(user, venture, input);
  return ok(updated);
}, { resource: 'venture', context: 'venture PATCH' });

export const DELETE = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:archive');
  const { ventureId } = await params;
  const venture = await requireVentureInScope(user, ventureId);
  await deleteVenture(user, venture);
  return NextResponse.json({ success: true, message: 'Venture deleted successfully' });
}, { resource: 'venture', context: 'venture DELETE' });
