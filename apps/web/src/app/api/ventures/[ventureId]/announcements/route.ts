import { z } from 'zod';
import { AnnouncementPriority } from '@prisma/client';
import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireVentureInScope } from '@/lib/scope';
import { requiredText } from '@/lib/validation/common';

type Ctx = { params: Promise<{ ventureId: string }> };

const announcementSchema = z.object({
  title: requiredText('title', 200),
  message: requiredText('message', 5000),
  priority: z
    .nativeEnum(AnnouncementPriority, { errorMap: () => ({ message: 'priority is invalid' }) })
    .default(AnnouncementPriority.NORMAL),
  audience: z.enum(['ALL', 'MANAGEMENT', 'SITE_STAFF'], { errorMap: () => ({ message: 'audience is invalid' }) }).default('ALL'),
});

export const GET = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const announcements = await prisma.ventureAnnouncement.findMany({
    where: { ventureId: venture.id },
    orderBy: { createdAt: 'desc' },
  });
  return ok(announcements);
}, { resource: 'announcement', context: 'announcements GET' });

export const POST = apiHandler<Ctx>(async (request, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:edit');
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const input = await parseBody(request, announcementSchema);

  const announcement = await prisma.$transaction(async (tx) => {
    const row = await tx.ventureAnnouncement.create({
      data: { ventureId: venture.id, createdById: user.id, ...input },
    });
    await recordAudit(tx, {
      userId: user.id,
      action: 'CREATE_VENTURE_ANNOUNCEMENT',
      ventureId: venture.id,
      details: { announcementId: row.id, title: row.title },
    });
    return row;
  });
  return created(announcement);
}, { resource: 'announcement', context: 'announcements POST' });
