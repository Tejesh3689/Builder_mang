import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildDataScope } from '@/lib/authorization';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const user = await requireAuth();
    const scopeInfo = await buildDataScope(user);
    const body = await req.json();

    const record = await prisma.attendance.findUnique({
      where: { id: resolvedParams.id },
      include: { employee: true }
    });

    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const employee = record.employee;

    // Authorization Check
    if (scopeInfo.scope === 'TEAM_LEVEL' && employee.reportingManagerId !== scopeInfo.identifier) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (scopeInfo.scope === 'SELF' && employee.userId !== scopeInfo.identifier) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow specific updates (status, checkOut, location)
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.checkOut) updateData.checkOut = new Date(body.checkOut);
    if (body.location) updateData.location = body.location;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    const updated = await prisma.attendance.update({
      where: { id: resolvedParams.id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
