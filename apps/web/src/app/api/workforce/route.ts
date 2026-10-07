import { requireAuth } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'employees:view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const allocations = await prisma.employeeVentureAssignment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        employee: {
          select: { id: true, employeeId: true, firstName: true, lastName: true, designation: true },
        },
        venture: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: allocations });
  } catch (error: any) {
    console.error('Failed to fetch workforce allocations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
