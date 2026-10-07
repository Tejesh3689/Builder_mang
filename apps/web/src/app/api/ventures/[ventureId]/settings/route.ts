import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireVentureInScope } from '@/lib/scope';
import { ventureSettingsSchema } from '@/lib/validation/venture';

type Ctx = { params: Promise<{ ventureId: string }> };

export const GET = apiHandler<Ctx>(async (_request, { params }) => {
  const user = await requireAuth();
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const setting = await prisma.ventureSetting.findUnique({ where: { ventureId: venture.id } });
  return ok(setting);
}, { resource: 'venture setting', context: 'venture settings GET' });

export const PATCH = apiHandler<Ctx>(async (request, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'ventures:edit');
  const venture = await requireVentureInScope(user, (await params).ventureId);
  const settings = await parseBody(request, ventureSettingsSchema);

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.ventureSetting.upsert({
      where: { ventureId: venture.id },
      update: settings,
      create: { ventureId: venture.id, ...settings },
    });
    await recordAudit(tx, { userId: user.id, action: 'UPDATE_VENTURE_SETTINGS', ventureId: venture.id, details: { settings } });
    return saved;
  });
  return ok(updated);
}, { resource: 'venture setting', context: 'venture settings PATCH' });
