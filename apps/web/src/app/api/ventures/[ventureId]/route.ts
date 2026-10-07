import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission, buildScopedWhere } from '@/lib/authorization';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    try {
      const venture = await prisma.venture.findFirst({
        where: {
          AND: [
            { OR: [{ id: ventureId }, { code: ventureId }] },
            scopedWhere
          ]
        },
        include: {
          projectDirector: { select: { id: true, firstName: true, lastName: true, designation: true } },
          projectManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          siteManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          constructionManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          financeManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          purchaseManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          assignments: {
            include: {
              employee: true,
            },
          },
          stocks: {
            include: {
              material: {
                include: { category: true, unitOfMeasure: true },
              },
            },
          },
          documents: true,
          announcements: { orderBy: { createdAt: 'desc' } },
          chatRooms: true,
          settings: true,
          requests: { select: { status: true } },
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!venture) {
        return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: venture });
    } catch (dbError: any) {
      console.error('Database error in venture GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Allowlist of fields that can be updated via PATCH
const PATCHABLE_FIELDS = [
  'name', 'description', 'status', 'type',
  'regAddressLine1', 'regCity', 'regState', 'regPincode', 'regDistrict',
  'siteAddressLine1', 'siteCity', 'siteState', 'sitePincode', 'siteDistrict',
  'latitude', 'longitude',
  'startDate', 'expectedCompletionDate', 'planningStartDate',
  'estimatedBudget', 'progressPercentage',
  'projectDirectorId', 'projectManagerId', 'siteManagerId',
  'constructionManagerId', 'financeManagerId', 'purchaseManagerId',
  'settings'
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'ventures:edit')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') {
      return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
    }
    const auth_existingVenture = await prisma.venture.findFirst({ where: { AND: [{ OR: [{ id: ventureId }, { code: ventureId }] }, scopedWhere] } });
    if (!auth_existingVenture) return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });

    const body = await request.json();

    // Only allow explicitly permitted fields — prevent arbitrary column overwrites
    const safeData: Record<string, any> = {};
    for (const key of PATCHABLE_FIELDS) {
      if (key in body) {
        safeData[key] = body[key];
      }
    }

    try {
      const updated = await prisma.venture.update({
        where: { id: auth_existingVenture.id },
        data: safeData,
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (dbError: any) {
      console.error('Database error in venture PATCH:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'ventures:archive')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or Project Manager access required' }, 
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') {
      return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
    }
    const auth_existingVenture = await prisma.venture.findFirst({ where: { AND: [{ OR: [{ id: ventureId }, { code: ventureId }] }, scopedWhere] } });
    if (!auth_existingVenture) return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });


    // Delete the venture
    await prisma.venture.delete({
      where: { id: auth_existingVenture.id },
    });
    
    // We don't need to create an audit log if the venture is deleted since its relations might cascade delete
    // If we wanted to, we would log it globally without linking the deleted ventureId

    return NextResponse.json({ success: true, message: 'Venture deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete venture:', error);
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
