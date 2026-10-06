import { PrismaClient } from '@prisma/client';
import { processLeaveApproval } from './src/services/leave.service';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- LEAVE CONCURRENCY TEST ---');
  
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  // Find an employee with a PAID leave balance > 5
  const employee = await prisma.employee.findFirst({
    where: { leaveBalancePaid: { gte: 10 } }
  });

  if (!employee) {
    console.log('No employee found with enough balance. Exiting.');
    return;
  }

  const initialBalance = employee.leaveBalancePaid;
  console.log(`Original balance: ${initialBalance}`);

  // Create a PENDING leave request
  const leaveReq = await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      type: 'PAID',
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-12'), // 3 days
      status: 'PENDING'
    }
  });

  console.log('Running two concurrent approval requests...');

  const [res1, res2] = await Promise.allSettled([
    processLeaveApproval(leaveReq.id, 'APPROVE', adminUser!.id),
    processLeaveApproval(leaveReq.id, 'APPROVE', adminUser!.id)
  ]);

  console.log(`Request A result: ${res1.status === 'fulfilled' ? 'SUCCESS' : res1.reason}`);
  console.log(`Request B result: ${res2.status === 'fulfilled' ? 'SUCCESS' : res2.reason}`);

  const finalReq = await prisma.leaveRequest.findUnique({ where: { id: leaveReq.id } });
  const finalEmp = await prisma.employee.findUnique({ where: { id: employee.id } });

  console.log(`Final leave status: ${finalReq?.status}`);
  console.log(`Final balance: ${finalEmp?.leaveBalancePaid}`);
  console.log(`Number of balance deductions: ${(initialBalance || 0) - (finalEmp?.leaveBalancePaid || 0) === 3 ? 1 : 0}`);

  await prisma.leaveRequest.delete({ where: { id: leaveReq.id } });
  await prisma.$disconnect();
}

runTests().catch(console.error);
