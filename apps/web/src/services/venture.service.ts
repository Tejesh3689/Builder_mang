import { VentureStatus, type Venture } from '@prisma/client';
import { prisma } from '@/lib/db';
import { conflict } from '@/lib/http/errors';
import { diffFields, recordAudit } from '@/lib/audit';
import { assertEmployeesEligible } from '@/lib/policies/employeeEligibility';
import {
  AUDITED_VENTURE_FIELDS,
  LEADER_FIELDS,
  assertCoordinatePair,
  assertDateOrder,
  type VentureCreateInput,
  type VentureUpdateInput,
} from '@/lib/validation/venture';

type Actor = { id: string };

const leaderRefs = (data: Partial<Record<(typeof LEADER_FIELDS)[number], string | null | undefined>>) =>
  LEADER_FIELDS.filter((f) => data[f]).map((f) => ({ field: f, id: data[f] as string }));

const DEFAULT_CHAT_ROOMS = ['General Discussion', 'Site Engineers & Ops', 'Materials & Procurement'];

export async function createVenture(actor: Actor, input: VentureCreateInput) {
  assertDateOrder(input);
  assertCoordinatePair(input.latitude, input.longitude);
  await assertEmployeesEligible(prisma, leaderRefs(input), { requireLogin: true });

  return prisma.$transaction(async (tx) => {
    const venture = await tx.venture.create({
      data: {
        ...input,
        estimatedBudget: input.estimatedBudget ?? 0,
        settings: { create: { minStockThresholdDefault: 50, requireMaterialApproval: true } },
        chatRooms: { create: DEFAULT_CHAT_ROOMS.map((name) => ({ name })) },
      },
      include: { chatRooms: { select: { id: true } } },
    });

    // Venture leaders and the creator join every default chat room.
    const leaderIds = leaderRefs(input).map((r) => r.id);
    const leaderUsers = leaderIds.length
      ? await tx.employee.findMany({ where: { id: { in: leaderIds } }, select: { userId: true } })
      : [];
    const memberUserIds = [...new Set([...leaderUsers.map((e) => e.userId), actor.id].filter((id): id is string => !!id))];
    if (memberUserIds.length) {
      await tx.chatMember.createMany({
        data: venture.chatRooms.flatMap((room) => memberUserIds.map((userId) => ({ roomId: room.id, userId }))),
        skipDuplicates: true,
      });
    }

    await recordAudit(tx, {
      userId: actor.id,
      action: 'CREATE_VENTURE',
      ventureId: venture.id,
      details: { code: venture.code, name: venture.name },
    });
    return venture;
  });
}

export async function updateVenture(actor: Actor, existing: Venture, input: VentureUpdateInput) {
  const { settings, ...fields } = input;
  const pick = <K extends keyof Venture>(k: K) => (fields[k as keyof typeof fields] !== undefined ? fields[k as keyof typeof fields] : existing[k]) as any;

  // Cross-field rules are checked against the venture as it will look after the update.
  assertDateOrder({
    planningStartDate: pick('planningStartDate'),
    startDate: pick('startDate'),
    expectedCompletionDate: pick('expectedCompletionDate'),
  });
  assertCoordinatePair(pick('latitude'), pick('longitude'));
  // Only leaders being (re)assigned are checked; unchanged leaders are left alone.
  await assertEmployeesEligible(prisma, leaderRefs(fields), { requireLogin: true });

  return prisma.$transaction(async (tx) => {
    if (settings) {
      await tx.ventureSetting.upsert({
        where: { ventureId: existing.id },
        create: { ...settings, ventureId: existing.id },
        update: settings,
      });
    }
    const updated = await tx.venture.update({ where: { id: existing.id }, data: fields });

    const changes = diffFields(existing as unknown as Record<string, unknown>, fields, AUDITED_VENTURE_FIELDS);
    const otherFields = Object.keys(fields).filter(
      (k) => !(AUDITED_VENTURE_FIELDS as readonly string[]).includes(k) && (fields as any)[k] !== undefined
    );
    if (Object.keys(changes).length || otherFields.length || settings) {
      await recordAudit(tx, {
        userId: actor.id,
        action: 'UPDATE_VENTURE',
        ventureId: existing.id,
        details: { changes, otherFieldsUpdated: otherFields, ...(settings ? { settings } : {}) },
      });
    }
    return updated;
  });
}

/**
 * Counts business records hanging off a venture. Auto-created scaffolding
 * (settings, empty default chat rooms, the creation audit entry) does not count.
 */
export async function countVentureHistory(ventureId: string) {
  const [counts, chatMessages, auditEntries] = await Promise.all([
    prisma.venture.findUniqueOrThrow({
      where: { id: ventureId },
      select: {
        _count: {
          select: {
            assignments: true, stocks: true, transactions: true, requests: true, documents: true,
            announcements: true, stockLocations: true, receipts: true, issues: true, transfers: true,
            returns: true, adjustments: true, consumptions: true,
          },
        },
      },
    }),
    prisma.chatMessage.count({ where: { room: { ventureId } } }),
    prisma.auditLog.count({ where: { ventureId, action: { not: 'CREATE_VENTURE' } } }),
  ]);
  const all: Record<string, number> = { ...counts._count, chatMessages, auditEntries };
  return Object.fromEntries(Object.entries(all).filter(([, n]) => n > 0));
}

/**
 * Hard delete is only allowed for a venture with no business history.
 * Anything with history must be archived instead (POST /api/ventures/:id/archive).
 */
export async function deleteVenture(actor: Actor, venture: Venture) {
  const history = await countVentureHistory(venture.id);
  if (Object.keys(history).length) {
    throw conflict('This venture has business history and cannot be deleted. Archive it instead.', { history });
  }

  await prisma.$transaction(async (tx) => {
    // The creation entry is the only audit row left; detach it so the FK does not block the delete.
    await tx.auditLog.updateMany({ where: { ventureId: venture.id }, data: { ventureId: null } });
    await tx.venture.delete({ where: { id: venture.id } });
    await recordAudit(tx, {
      userId: actor.id,
      action: 'DELETE_VENTURE',
      details: { id: venture.id, code: venture.code, name: venture.name },
    });
  });
}

export async function archiveVenture(actor: Actor, venture: Venture) {
  if (venture.status === VentureStatus.ARCHIVED) throw conflict('Venture is already archived.');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.venture.update({
      where: { id: venture.id },
      data: { status: VentureStatus.ARCHIVED, archivedAt: new Date(), archivedBy: actor.id },
    });
    await recordAudit(tx, {
      userId: actor.id,
      action: 'ARCHIVE_VENTURE',
      ventureId: venture.id,
      details: { previousStatus: venture.status },
    });
    return updated;
  });
}
