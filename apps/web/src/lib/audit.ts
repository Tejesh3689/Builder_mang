import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function logAudit(
  userId: string,
  action: string,
  details: string,
  ventureId?: string | null
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ventureId: ventureId || null,
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

type AuditDb = Pick<Prisma.TransactionClient, 'auditLog'>;

/**
 * Writes a structured audit entry inside the caller's transaction, so the audit
 * record and the change it describes commit (or roll back) together.
 * `details` is stored as JSON.
 */
export async function recordAudit(
  db: AuditDb,
  entry: { userId: string; action: string; ventureId?: string | null; details: Record<string, unknown> }
) {
  await db.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      ventureId: entry.ventureId ?? null,
      details: JSON.stringify(entry.details),
    },
  });
}

const comparable = (v: unknown) => (v instanceof Date ? v.toISOString() : v ?? null);

/** Old/new pairs for the listed fields that actually change. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  patch: Partial<Record<keyof T, unknown>>,
  fields: readonly (keyof T & string)[]
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const f of fields) {
    if (!(f in patch) || patch[f] === undefined) continue;
    const oldV = comparable(before[f]);
    const newV = comparable(patch[f]);
    if (oldV !== newV) changes[f] = { old: oldV, new: newV };
  }
  return changes;
}
