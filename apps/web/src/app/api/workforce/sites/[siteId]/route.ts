import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    // For site allocations, we filter by the project site ID/venture ID representing the site
    const allocations = await prisma.employeeVentureAssignment.findMany({
      where: {
        ventureId: siteId,
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
    console.error('Failed to fetch site workforce allocations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
