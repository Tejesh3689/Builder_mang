import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';
import { recordAudit } from '@/lib/audit';

const calculateDays = (start: Date, end: Date) => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const user = await requireAuth();
    const requestId = params.id;
    const body = await parseJsonSafe(req);
    const { action } = body; // APPROVE, REJECT, CANCEL

    if (!['APPROVE', 'REJECT', 'CANCEL'].includes(action)) throw new ApiError(400, 'Invalid action');

    const existing = await prisma.leaveRequest.findUnique({ where: { id: requestId }, include: { employee: true } });
    if (!existing) throw new ApiError(404, 'Leave request not found');

    if (action === 'CANCEL') {
      if ((user as any).role === 'USER' && existing.employeeId !== (user as any).employee?.id) {
        throw new ApiError(403, 'Forbidden');
      }
      if (existing.status === 'CANCELLED' || existing.status === 'REJECTED') {
         throw new ApiError(409, 'Cannot cancel already finalized request');
      }
    } else {
      const { hasPermission } = await import('@/lib/permissions');
      if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'employees:edit')) {
        throw new ApiError(403, 'Forbidden');
      }
      if (existing.status !== 'PENDING') throw new ApiError(409, 'Only PENDING requests can be processed');
    }

    const days = calculateDays(existing.startDate, existing.endDate);

    const result = await prisma.$transaction(async (tx) => {
       const nextStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'CANCELLED');
       
       const updated = await tx.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: nextStatus,
            approvedById: action === 'APPROVE' || action === 'REJECT' ? user.id : undefined,
            approvedAt: action === 'APPROVE' || action === 'REJECT' ? new Date() : undefined,
          }
       });

       // Deduct balance on APPROVE
       if (action === 'APPROVE') {
          let balanceField = '';
          if (existing.type === 'PAID') balanceField = 'leaveBalancePaid';
          else if (existing.type === 'SICK') balanceField = 'leaveBalanceSick';
          else if (existing.type === 'CASUAL') balanceField = 'leaveBalanceCasual';
          
          if (balanceField) {
             const current = await tx.employee.findUnique({ where: { id: existing.employeeId } });
             if ((current as any)[balanceField] < days) {
                throw new ApiError(409, 'Insufficient balance for approval');
             }
             await tx.employee.update({
                where: { id: existing.employeeId },
                data: { [balanceField]: { decrement: days } }
             });
          }
       } else if (action === 'CANCEL' && existing.status === 'APPROVED') {
          // Restore balance if cancelled after approval
          let balanceField = '';
          if (existing.type === 'PAID') balanceField = 'leaveBalancePaid';
          else if (existing.type === 'SICK') balanceField = 'leaveBalanceSick';
          else if (existing.type === 'CASUAL') balanceField = 'leaveBalanceCasual';
          
          if (balanceField) {
             await tx.employee.update({
                where: { id: existing.employeeId },
                data: { [balanceField]: { increment: days } }
             });
          }
       }

       await recordAudit(tx, {
          userId: user.id,
          action: `LEAVE_REQUEST_${action}`,
          details: { requestId, employeeId: existing.employeeId, days, type: existing.type }
       });

       return updated;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return handleApiError(e);
  }
}
