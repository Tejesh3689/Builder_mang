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
