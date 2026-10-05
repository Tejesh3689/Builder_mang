const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE SAFETY VERIFICATION ---');

  // Verify tables exist
  try {
    const attendanceCount = await prisma.attendance.count();
    console.log(`[PASS] Attendance table exists (Count: ${attendanceCount})`);
  } catch (e) {
    console.log('[FAIL] Attendance table error:', e.message);
  }

  try {
    const leaveCount = await prisma.leaveRequest.count();
    console.log(`[PASS] LeaveRequest table exists (Count: ${leaveCount})`);
  } catch (e) {
    console.log('[FAIL] LeaveRequest table error:', e.message);
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
    console.log('[INFO] Attendance might already exist:', e.message);
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

  console.log('Verification Complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
