import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assignments = await prisma.employeeVentureAssignment.findMany({
      where: { employeeId: id },
      include: {
        venture: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Failed to fetch assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { ventureId, roleAtSite, accessLevel, startDate } = body;

    if (!ventureId) {
      return NextResponse.json(
        { success: false, error: 'Venture ID is required.' },
        { status: 400 }
      );
    }

    // 1. Deactivate any currently active assignments for this employee
    await prisma.employeeVentureAssignment.updateMany({
      where: {
        employeeId: id,
        status: 'ACTIVE',
      },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
    });

    // 2. Create new assignment
    const assignment = await prisma.employeeVentureAssignment.create({
      data: {
        employeeId: id,
        ventureId,
        roleAtSite,
        accessLevel: accessLevel || 'STANDARD',
        startDate: startDate ? new Date(startDate) : new Date(),
        status: 'ACTIVE',
      },
      include: {
        venture: true,
      },
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('Failed to create assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
