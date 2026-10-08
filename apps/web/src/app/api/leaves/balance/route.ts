import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError } from '@/lib/api-errors';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    let targetEmployeeId = employeeId;
    if ((user as any).role === 'USER') {
      if (!(user as any).employee?.id) throw new ApiError(403, 'User not linked to an employee');
      if (employeeId && employeeId !== (user as any).employee?.id) throw new ApiError(403, 'Forbidden');
      targetEmployeeId = (user as any).employee?.id;
    }

    if (!targetEmployeeId) throw new ApiError(400, 'employeeId is required');

    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { leaveBalancePaid: true, leaveBalanceSick: true, leaveBalanceCasual: true }
    });

    if (!employee) throw new ApiError(404, 'Employee not found');

    return NextResponse.json({ success: true, data: employee });
  } catch (e) {
    return handleApiError(e);
  }
}
