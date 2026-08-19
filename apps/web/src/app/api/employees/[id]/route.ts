import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EmployeeStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
