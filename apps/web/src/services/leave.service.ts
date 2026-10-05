import { prisma } from '@/lib/db';

export async function processLeaveApproval(leaveId: string, action: 'APPROVE' | 'REJECT', userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Load LeaveRequest
    const leave = await tx.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true }
    });

    if (!leave) throw new Error('LeaveRequest not found');
    
    // 2. Verify status is PENDING
    if (leave.status !== 'PENDING') {
      throw new Error(`Cannot transition from ${leave.status} to ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}`);
    }

    if (action === 'REJECT') {
      return await tx.leaveRequest.update({
        where: { id: leaveId },
        data: {
          status: 'REJECTED',
          approvedById: userId, // Tracking who rejected it in the same field or custom logic
          approvedAt: new Date()
        }
      });
    }

    // APPROVAL LOGIC
    // 4. Determine requested duration in days (naive approach for this example)
    const durationMs = leave.endDate.getTime() - leave.startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1; // inclusive

    // 5. Determine applicable leave balance
    let balanceField: 'leaveBalancePaid' | 'leaveBalanceSick' | 'leaveBalanceCasual' | null = null;
    
    if (leave.type === 'PAID') balanceField = 'leaveBalancePaid';
    if (leave.type === 'SICK') balanceField = 'leaveBalanceSick';
    if (leave.type === 'CASUAL') balanceField = 'leaveBalanceCasual';

    if (balanceField) {
      const currentBalance = leave.employee[balanceField] || 0;
      
      // 6. Verify sufficient balance
      if (currentBalance < durationDays) {
        throw new Error('Insufficient leave balance');
      }

      // 7. Decrement balance
      await tx.employee.update({
        where: { id: leave.employeeId },
        data: {
          [balanceField]: currentBalance - durationDays
        }
      });
    }

    // 8-10. Update leave status
    return await tx.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date()
      }
    });
  });
}
