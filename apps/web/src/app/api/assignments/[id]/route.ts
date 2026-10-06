import { requireAuth } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const existing = await prisma.employeeVentureAssignment.findUnique({ where: { id: await params.then(p => p.id) } });
    if (!existing) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
    
    const hasVentureAccess = await prisma.venture.findFirst({ where: { AND: [{ id: existing.ventureId }, scopedWhere] } });
    if (!hasVentureAccess) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { accessLevel, status, endDate } = body;

    const updated = await prisma.employeeVentureAssignment.update({
      where: { id },
      data: {
        accessLevel,
        status,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update assignment:', error);
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
    const user = await requireAuth();

    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const existing = await prisma.employeeVentureAssignment.findUnique({ where: { id: await params.then(p => p.id) } });
    if (!existing) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
    
    const hasVentureAccess = await prisma.venture.findFirst({ where: { AND: [{ id: existing.ventureId }, scopedWhere] } });
    if (!hasVentureAccess) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    const { id } = await params;

    await prisma.employeeVentureAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: 'Assignment deleted successfully.' } });
  } catch (error: any) {
    console.error('Failed to delete assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
