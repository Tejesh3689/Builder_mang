import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere, buildDataScope } from '@/lib/authorization';
import { AttendanceSchema } from '@builder/validation';
import { z } from 'zod';
import { getPaginationParams } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const scopedWhere = await buildScopedWhere(user, 'attendance');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }
    
    if (employeeId) {
      // Explicitly reject foreign employeeId
      const emp = await prisma.employee.findFirst({
        where: { AND: [{ id: employeeId }, scopedWhere.employee || {}] }
      });
      if (!emp) {
        return NextResponse.json({ error: 'Forbidden: Employee not in scope' }, { status: 403 });
      }
      where.employeeId = employeeId;
    }

    const { skip, take } = getPaginationParams(req);
    const records = await prisma.attendance.findMany({
      where: { AND: [where, scopedWhere] },
      skip,
      take,
      include: {
        employee: { select: { firstName: true, lastName: true, reportingManagerId: true } },
      },
      orderBy: { date: 'desc' }
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

    const data = AttendanceSchema.parse(body);

    const scopedWhere = await buildScopedWhere(user, 'employee');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const employee = await prisma.employee.findFirst({
      where: { AND: [{ id: data.employeeId }, scopedWhere] }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden: Cannot create attendance for this employee' }, { status: 403 });
    }

    // Upsert logic for attendance
    const start = new Date(data.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        date: { gte: start, lt: end }
      }
    });

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: data.status as any,
          checkIn: data.checkIn ? new Date(data.checkIn) : null,
          checkOut: data.checkOut ? new Date(data.checkOut) : null,
          location: data.location
        }
      });
      return NextResponse.json(updated, { status: 200 });
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        date: new Date(data.date),
        status: data.status as any,
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        location: data.location,
        markedById: (user as any).id
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 422 });
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
