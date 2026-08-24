import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EmployeeStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || 'USER';
    const sessionName = session?.user?.name || '';
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
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

    if (userRole === 'SUPERVISOR' && employee.reportingManager !== sessionName) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have access to this employee' },
        { status: 403 }
      );
    }

    if (userRole === 'MANAGER' && employee.reportingManager !== sessionName) {
      const directReports = await prisma.employee.findMany({
        where: { reportingManager: sessionName },
        select: { firstName: true, lastName: true }
      });
      const directReportNames = directReports.map(emp => `${emp.firstName} ${emp.lastName}`);
      
      if (!directReportNames.includes(employee.reportingManager || '')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have access to this employee' },
          { status: 403 }
        );
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
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || 'USER';
    
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
      reportingManager,
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
        reportingManager,
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
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
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
