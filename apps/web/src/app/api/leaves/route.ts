import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { LeaveRequestSchema, leaveDurationDays } from '@builder/validation';
import { z } from 'zod';
import { getPaginationParams } from '@/lib/pagination';

// GET: leave requests in the caller's scope
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const scopedWhere = await buildScopedWhere(user, 'leave');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (status) where.status = status;

    if (employeeId) {
      // Explicitly reject foreign employeeId (Root Cause 6)
      const emp = await prisma.employee.findFirst({
        where: { AND: [{ id: employeeId }, scopedWhere.employee || {}] }
      });
      if (!emp) {
        return NextResponse.json({ success: false, error: 'Forbidden: Employee not in scope' }, { status: 403 });
      }
      where.employeeId = employeeId;
    }

    const { skip, take } = getPaginationParams(req);
    const records = await prisma.leaveRequest.findMany({
      where: { AND: [where, scopedWhere] },
      skip,
      take,
      include: {
        employee: { select: { employeeId: true, firstName: true, lastName: true, reportingManagerId: true, leaveBalancePaid: true, leaveBalanceSick: true, leaveBalanceCasual: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

// POST: apply for leave for an employee in the caller's scope
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const data = LeaveRequestSchema.parse(body);

    const scopedWhere = await buildScopedWhere(user, 'employee');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const employee = await prisma.employee.findFirst({
      where: { AND: [{ id: data.employeeId }, scopedWhere] }
    });

    if (!employee) {
      // Explicitly reject foreign employeeId (Root Cause 3, 6)
      return NextResponse.json({ success: false, error: 'Forbidden: Employee not in scope or not found' }, { status: 403 });
    }
    if (employee.status === 'TERMINATED') {
      return NextResponse.json({ success: false, error: 'Employee is terminated' }, { status: 409 });
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Early balance check (authoritative check + deduction happens atomically on approval)
    const days = leaveDurationDays(startDate, endDate);
    const balance =
      data.type === 'PAID' ? employee.leaveBalancePaid :
      data.type === 'SICK' ? employee.leaveBalanceSick :
      data.type === 'CASUAL' ? employee.leaveBalanceCasual : null;
    if (balance !== null && (balance ?? 0) < days) {
      return NextResponse.json({ success: false, error: `Insufficient ${data.type} leave balance` }, { status: 409 });
    }

    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: data.employeeId,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      }
    });
    if (overlap) {
      return NextResponse.json({ success: false, error: 'Leave request overlaps with an existing active request' }, { status: 409 });
    }

    const record = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        type: data.type as any,
        startDate,
        endDate,
        reason: data.reason,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.errors }, { status: 422 });
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
