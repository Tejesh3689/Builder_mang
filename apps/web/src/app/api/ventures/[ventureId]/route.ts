import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    try {
      const venture = await prisma.venture.findFirst({
        where: {
          OR: [{ id: ventureId }, { code: ventureId }],
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
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!venture) {
        throw new Error('Venture not found');
      }

      return NextResponse.json({ success: true, data: venture });
    } catch (dbError: any) {
      console.error('Database error in venture GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
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
];

export async function PATCH(
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
        where: { id: ventureId },
        data: safeData,
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (dbError: any) {
      console.error('Database error in venture PATCH:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
