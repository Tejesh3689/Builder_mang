import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
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
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;
    const { employeeId, roleAtSite, accessLevel = 'STANDARD' } = await request.json();

    try {
      const created = await prisma.employeeVentureAssignment.create({
        data: {
          ventureId,
          employeeId,
          roleAtSite,
          accessLevel,
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
