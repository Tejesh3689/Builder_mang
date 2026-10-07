import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere, buildDataScope } from '@/lib/authorization';
import { LeaveRequestSchema } from '@builder/validation';
import { z } from 'zod';
import { getPaginationParams } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const scopedWhere = await buildScopedWhere(user, 'leave');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
        return NextResponse.json({ error: 'Forbidden: Employee not in scope' }, { status: 403 });
      }
      where.employeeId = employeeId;
    }

    const { skip, take } = getPaginationParams(req);
    const records = await prisma.leaveRequest.findMany({
      where: { AND: [where, scopedWhere] },
      skip,
      take,
      include: {
        employee: { select: { firstName: true, lastName: true, reportingManagerId: true, leaveBalancePaid: true, leaveBalanceSick: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const data = LeaveRequestSchema.parse(body);

    const scopedWhere = await buildScopedWhere(user, 'employee');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const employee = await prisma.employee.findFirst({
      where: { AND: [{ id: data.employeeId }, scopedWhere] }
    });

    if (!employee) {
      // Explicitly reject foreign employeeId (Root Cause 3, 6)
      return NextResponse.json({ error: 'Forbidden: Employee not in scope or not found' }, { status: 403 });
    }

    const record = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        type: data.type as any,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: 'PENDING'
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 422 });
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
