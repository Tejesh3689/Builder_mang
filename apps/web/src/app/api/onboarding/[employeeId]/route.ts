import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: employeeId },
          { employeeId: employeeId },
          { employeeId: employeeId.toUpperCase() },
        ],
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        onboardingStage: true,
        onboardingStatus: true,
        designation: true,
        department: true,
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
    console.error('Failed to fetch employee onboarding details:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    const body = await req.json();
    const { onboardingStage, onboardingStatus } = body;

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        onboardingStage,
        onboardingStatus,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update employee onboarding details:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
