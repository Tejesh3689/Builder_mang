import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

// Helper to calculate days (simplified, ideally excludes weekends/holidays)
const calculateDays = (start: Date, end: Date) => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// GET: Retrieve leave requests
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    if ((user as any).role === 'USER') {
      if (!(user as any).employee?.id) throw new ApiError(403, 'User not linked to an employee');
      if (employeeId && employeeId !== (user as any).employee?.id) throw new ApiError(403, 'Forbidden');
    }

    const where: any = {};
    if ((user as any).role === 'USER') {
      where.employeeId = user.employee!.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) where.status = status;

    const records = await prisma.leaveRequest.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST: Apply for leave
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await parseJsonSafe(req);
    
    let targetEmployeeId = body.employeeId;
    if ((user as any).role === 'USER') {
      if (!(user as any).employee?.id) throw new ApiError(403, 'User not linked to an employee');
      targetEmployeeId = user.employee!.id;
    }

    if (!targetEmployeeId || !body.type || !body.startDate || !body.endDate) {
      throw new ApiError(400, 'Missing required fields');
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    startDate.setUTCHours(0,0,0,0);
    endDate.setUTCHours(0,0,0,0);

    if (endDate < startDate) throw new ApiError(400, 'End date cannot be before start date');
    const daysRequested = calculateDays(startDate, endDate);

    const employee = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });
    if (!employee) throw new ApiError(404, 'Employee not found');
    if (employee.status === 'TERMINATED') throw new ApiError(409, 'Employee is terminated');

    // Check balance if needed (can also wait until approval, but good to check early)
    let balance = 0;
    if (body.type === 'PAID') balance = employee.leaveBalancePaid || 0;
    else if (body.type === 'SICK') balance = employee.leaveBalanceSick || 0;
    else if (body.type === 'CASUAL') balance = employee.leaveBalanceCasual || 0;
    
    if (balance < daysRequested) throw new ApiError(409, `Insufficient ${body.type} leave balance`);

    // Check overlaps
    const overlaps = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: targetEmployeeId,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } }
        ]
      }
    });

    if (overlaps) throw new ApiError(409, 'Leave request overlaps with an existing active request');

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: targetEmployeeId,
        type: body.type,
        startDate,
        endDate,
        reason: body.reason,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
