import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const allocations = await prisma.employeeVentureAssignment.findMany({
      where: {
        ventureId: projectId,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: { id: true, employeeId: true, firstName: true, lastName: true, designation: true },
        },
        venture: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: allocations });
  } catch (error: any) {
    console.error('Failed to fetch project workforce allocations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
