import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EmployeeStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { requireAuth, buildDataScope } from '@/lib/authorization';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const scopeInfo = await buildDataScope(user);
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        reportingManager: {
          select: { firstName: true, lastName: true }
        },
        assignments: {
          include: {
            venture: true,
          },
        },
        skills: true,
        certifications: true,
        documents: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found.' },
        { status: 404 }
      );
    }

    if (scopeInfo.scope === 'SELF' && employee.userId !== scopeInfo.identifier) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (scopeInfo.scope === 'TEAM_LEVEL' && employee.reportingManagerId !== scopeInfo.identifier) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (scopeInfo.scope === 'VENTURE_LEVEL') {
      const managerAssignments = await prisma.assignment.findMany({
        where: { employee: { userId: scopeInfo.identifier }, status: 'ACTIVE' },
        select: { ventureId: true }
      });
      const managerVentureIds = managerAssignments.map(a => a.ventureId);
      
      const hasSharedVenture = employee.assignments.some(
        a => a.status === 'ACTIVE' && managerVentureIds.includes(a.ventureId)
      );

      if (!hasSharedVenture && employee.userId !== scopeInfo.identifier) {
        return NextResponse.json({ success: false, error: 'Forbidden: Out of Venture Scope' }, { status: 403 });
      }
    }
    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    console.error('Failed to fetch employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const userRole = (user as any).role || 'USER';
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden: Elevated access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      designation,
      department,
      status,
      joiningDate,
      reportingManagerId,
      employmentType,
      onboardingStage,
      onboardingStatus,
    } = body;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        email,
        designation,
        department,
        status: status ? (status as EmployeeStatus) : undefined,
        joiningDate,
        reportingManagerId,
        employmentType,
        onboardingStage,
        onboardingStatus,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if ((user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete / deactivate
    const deactivated = await prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.TERMINATED,
      },
    });

    return NextResponse.json({ success: true, data: deactivated });
  } catch (error: any) {
    console.error('Failed to deactivate employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
