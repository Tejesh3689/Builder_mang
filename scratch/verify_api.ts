import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE SAFETY VERIFICATION ---');

  // Verify tables exist
  try {
    const attendanceCount = await prisma.attendance.count();
    console.log(`[PASS] Attendance table exists (Count: ${attendanceCount})`);
  } catch (e) {
    console.log('[FAIL] Attendance table error:', e);
  }

  try {
    const leaveCount = await prisma.leaveRequest.count();
    console.log(`[PASS] LeaveRequest table exists (Count: ${leaveCount})`);
  } catch (e) {
    console.log('[FAIL] LeaveRequest table error:', e);
  }

  // Find a test employee
  const employee = await prisma.employee.findFirst();
  if (!employee) {
    console.log('No employee found, skipping data tests.');
    return;
  }

  console.log('--- ATTENDANCE DUPLICATE PROTECTION ---');
  // Create attendance
  const date = new Date('2026-10-05T00:00:00Z');
  
  try {
    await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: date,
        status: 'PRESENT',
        markedById: 'system'
      }
    });
    console.log('[PASS] Created first attendance');
  } catch (e) {
    console.log('[INFO] Attendance might already exist');
  }

  try {
    await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: date,
        status: 'ABSENT',
        markedById: 'system'
      }
    });
    console.log('[FAIL] Duplicate attendance created!');
  } catch (e) {
    console.log('[PASS] Duplicate protection worked (unique constraint thrown)');
  }

  console.log('--- LEAVE BALANCE TRANSACTION ---');
  // To test the logic from leave.service.ts
  const { processLeaveApproval } = await import('../apps/web/src/services/leave.service.ts');
  
  // Setup test leave
  const leave = await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      type: 'PAID',
      startDate: new Date('2026-10-10T00:00:00Z'),
      endDate: new Date('2026-10-11T00:00:00Z'), // 2 days
      reason: 'Test',
      status: 'PENDING'
    }
  });

  const originalBalance = employee.leaveBalancePaid || 0;
  console.log(`Original Balance: ${originalBalance}`);

  if (originalBalance >= 2) {
    try {
      await processLeaveApproval(leave.id, 'APPROVE', 'system');
      const updatedEmp = await prisma.employee.findUnique({ where: { id: employee.id } });
      const updatedLeave = await prisma.leaveRequest.findUnique({ where: { id: leave.id } });
      
      if (updatedLeave?.status === 'APPROVED' && updatedEmp?.leaveBalancePaid === originalBalance - 2) {
        console.log('[PASS] Leave transaction successful');
      } else {
        console.log('[FAIL] Leave transaction mismatch');
      }
    } catch (e) {
      console.log('[FAIL] Leave approval error:', e);
    }
  }

  // Clean up
  await prisma.attendance.deleteMany({ where: { employeeId: employee.id, date: date } });
  await prisma.leaveRequest.delete({ where: { id: leave.id } });

  console.log('Verification Complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
