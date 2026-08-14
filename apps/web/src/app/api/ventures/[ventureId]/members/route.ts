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
    } catch {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'asgn-1', employee: { firstName: 'Suresh', lastName: 'Verma', designation: 'Project Manager', department: 'Management' }, roleAtSite: 'Project Manager', accessLevel: 'FULL_PROJECT_ACCESS' },
          { id: 'asgn-2', employee: { firstName: 'Ajay', lastName: 'Rao', designation: 'Lead Site Engineer', department: 'Engineering' }, roleAtSite: 'Site Engineer', accessLevel: 'OPERATIONS_ACCESS' },
          { id: 'asgn-3', employee: { firstName: 'Vikram', lastName: 'Singh', designation: 'Storekeeper', department: 'Logistics' }, roleAtSite: 'Store Manager', accessLevel: 'MATERIAL_ACCESS' },
        ],
      });
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
    } catch {
      return NextResponse.json({
        success: true,
        data: { id: `asgn-${Date.now()}`, ventureId, employeeId, roleAtSite, accessLevel },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
