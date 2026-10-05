import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildDataScope } from '@/lib/authorization';
import { AttendanceSchema } from '@builder/validation';
import { z } from 'zod';

// Helper to apply data scope to employee queries
function applyEmployeeScope(scopeInfo: any) {
  if (scopeInfo.scope === 'SELF') {
    return { userId: scopeInfo.identifier };
  }
  if (scopeInfo.scope === 'TEAM_LEVEL') {
    // Limitation removed: Using reportingManagerId
    return { reportingManagerId: scopeInfo.identifier };
  }
  if (scopeInfo.scope === 'VENTURE_LEVEL') {
    // A proper manager check would look at Ventures they manage.
    // For now, if they are a manager, we might just allow all or check specific venture logic.
    // Assuming they can see employees assigned to ventures they manage:
    return {
      assignments: {
        some: {
          venture: {
            OR: [
              { projectDirectorId: { equals: scopeInfo.identifier } },
              { projectManagerId: { equals: scopeInfo.identifier } },
              { siteManagerId: { equals: scopeInfo.identifier } },
              { constructionManagerId: { equals: scopeInfo.identifier } },
            ]
          }
        }
      }
    };
  }
  // ADMIN
  return {};
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const scopeInfo = await buildDataScope(user);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    const employeeWhere = applyEmployeeScope(scopeInfo);

    const where: any = {
      employee: employeeWhere,
    };

    if (dateStr) {
      // Assuming exact date match for simplicity. In production, might need startOfDay/endOfDay.
      where.date = new Date(dateStr);
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const records = await prisma.attendance.findMany({
      where,
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
    const scopeInfo = await buildDataScope(user);
    const body = await req.json();

    const data = AttendanceSchema.parse(body);

    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { assignments: { include: { venture: true } } }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Authorization Check
    if (scopeInfo.scope === 'TEAM_LEVEL' && employee.reportingManagerId !== scopeInfo.identifier) {
      return NextResponse.json({ error: 'Forbidden: Cannot mark attendance for this employee' }, { status: 403 });
    }

    if (scopeInfo.scope === 'SELF' && employee.userId !== scopeInfo.identifier) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check duplicate
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: new Date(data.date)
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Attendance already marked for this date' }, { status: 409 });
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
