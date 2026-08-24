import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    try {
      const assignments = await prisma.employeeVentureAssignment.findMany({
        where: { ventureId },
        include: { employee: true },
      });
      return NextResponse.json({ success: true, data: assignments });
    } catch (dbError: any) {
      console.error('Database error in members GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;
    const { employeeId, roleAtSite, accessLevel = 'STANDARD' } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    try {
      // Deactivate any currently active assignments for this employee (matching the employee/[id]/assignments endpoint)
      await prisma.employeeVentureAssignment.updateMany({
        where: { employeeId, status: 'ACTIVE' },
        data: { status: 'COMPLETED', endDate: new Date() },
      });

      const created = await prisma.employeeVentureAssignment.create({
        data: {
          ventureId,
          employeeId,
          roleAtSite,
          accessLevel,
          status: 'ACTIVE',
        },
        include: { employee: true },
      });
      return NextResponse.json({ success: true, data: created });
    } catch (dbError: any) {
      console.error('Database error in members POST:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
