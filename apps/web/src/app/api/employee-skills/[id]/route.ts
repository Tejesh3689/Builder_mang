import { requireAuth } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'skills:edit')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'employee');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Since multiple params are handled in different functions, resolve params.id
    const resourceId = await params.then(p => p.id);
    const targetResource = await prisma.employeeSkill.findUnique({ where: { id: resourceId } });
    if (!targetResource) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });

    const authorizedEmployee = await prisma.employee.findFirst({
      where: { AND: [{ id: targetResource.employeeId }, scopedWhere] }
    });
    if (!authorizedEmployee) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { category, proficiency, experienceYears, verificationStatus, verifiedBy } = body;

    const updated = await prisma.employeeSkill.update({
      where: { id },
      data: {
        category,
        proficiency,
        experienceYears,
        verificationStatus,
        verifiedBy,
        verificationDate: verificationStatus === 'Verified' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update employee skill:', error);
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
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'skills:edit')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'employee');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Since multiple params are handled in different functions, resolve params.id
    const resourceId = await params.then(p => p.id);
    const targetResource = await prisma.employeeSkill.findUnique({ where: { id: resourceId } });
    if (!targetResource) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });

    const authorizedEmployee = await prisma.employee.findFirst({
      where: { AND: [{ id: targetResource.employeeId }, scopedWhere] }
    });
    if (!authorizedEmployee) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    const { id } = await params;

    await prisma.employeeSkill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: 'Employee skill deleted successfully.' } });
  } catch (error: any) {
    console.error('Failed to delete employee skill:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
