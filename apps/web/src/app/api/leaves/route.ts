import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildDataScope } from '@/lib/authorization';
import { LeaveRequestSchema } from '@builder/validation';
import { z } from 'zod';

function applyEmployeeScope(scopeInfo: any) {
  if (scopeInfo.scope === 'SELF') return { userId: scopeInfo.identifier };
  if (scopeInfo.scope === 'TEAM_LEVEL') return { reportingManagerId: scopeInfo.identifier };
  if (scopeInfo.scope === 'VENTURE_LEVEL') {
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
  return {};
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const scopeInfo = await buildDataScope(user);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const employeeWhere = applyEmployeeScope(scopeInfo);
    const where: any = { employee: employeeWhere };

    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const records = await prisma.leaveRequest.findMany({
      where,
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
    const scopeInfo = await buildDataScope(user);
    const body = await req.json();

    const data = LeaveRequestSchema.parse(body);

    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Auth check: Employees can request for themselves, Supervisors can request for team
    if (scopeInfo.scope === 'TEAM_LEVEL' && employee.reportingManagerId !== scopeInfo.identifier) {
      return NextResponse.json({ error: 'Forbidden: Cannot request leave for this employee' }, { status: 403 });
    }
    if (scopeInfo.scope === 'SELF' && employee.userId !== scopeInfo.identifier) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
