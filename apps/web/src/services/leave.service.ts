import { prisma } from '@/lib/db';
import { leaveDurationDays } from '@builder/validation';

export async function processLeaveApproval(leaveId: string, action: 'APPROVE' | 'REJECT', userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Load LeaveRequest
    const leave = await tx.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true }
    });

    if (!leave) throw new Error('LeaveRequest not found');
    // 2. We skip read-only check and use optimistic concurrency in updateMany
    if (action === 'REJECT') {
      const res = await tx.leaveRequest.updateMany({
        where: { id: leaveId, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          approvedById: userId,
          approvedAt: new Date()
        }
      });
      if (res.count === 0) throw new Error('Cannot transition status or leave not found');
      return await tx.leaveRequest.findUnique({ where: { id: leaveId } });
    }

    // APPROVAL LOGIC
    // 4. Determine requested duration in calendar days (inclusive, business timezone)
    const durationDays = leaveDurationDays(leave.startDate, leave.endDate);

    // 5. Determine applicable leave balance
    let balanceField: 'leaveBalancePaid' | 'leaveBalanceSick' | 'leaveBalanceCasual' | null = null;
    
    if (leave.type === 'PAID') balanceField = 'leaveBalancePaid';
    if (leave.type === 'SICK') balanceField = 'leaveBalanceSick';
    if (leave.type === 'CASUAL') balanceField = 'leaveBalanceCasual';

    if (balanceField) {
      // 6-7. Verify sufficient balance and decrement atomically
      const res = await tx.employee.updateMany({
        where: { 
          id: leave.employeeId,
          [balanceField]: { gte: durationDays }
        },
        data: {
          [balanceField]: { decrement: durationDays }
        }
      });

      if (res.count === 0) {
        throw new Error('Insufficient leave balance');
      }
    }

    // 8-10. Update leave status atomically
    const res = await tx.leaveRequest.updateMany({
      where: { id: leaveId, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date()
      }
    });

    if (res.count === 0) {
      throw new Error('Leave request already processed or not found');
    }

    return await tx.leaveRequest.findUnique({ where: { id: leaveId } });
  });
}
