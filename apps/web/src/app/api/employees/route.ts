import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EmployeeStatus } from '@prisma/client';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        assignments: {
          include: {
            venture: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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
      onboardingStage,
      onboardingStatus,
      reportingManager,
      employmentType,
      ventureId,
    } = body;

    if (!firstName || !designation) {
      return NextResponse.json(
        { success: false, error: 'First name and designation/role are required.' },
        { status: 400 }
      );
    }

    // Generate unique employee ID (EMP-XXX)
    const empCount = await prisma.employee.count();
    const employeeId = `EMP-${String(empCount + 1000).padStart(4, '0')}`;

    // Create Employee record
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        firstName,
        lastName: lastName || '',
        phone,
        email,
        designation,
        department: department || 'Site Operations',
        status: status ? (status as EmployeeStatus) : EmployeeStatus.ACTIVE,
        onboardingStage: onboardingStage || 'Active',
        onboardingStatus: onboardingStatus || 'Active',
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        reportingManager,
        employmentType,
        ...(ventureId && ventureId !== 'none'
          ? {
              assignments: {
                create: {
                  ventureId,
                  roleAtSite: designation,
                  status: 'ACTIVE',
                },
              },
            }
          : {}),
      },
      include: {
        assignments: {
          include: {
            venture: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    console.error('Failed to create employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
