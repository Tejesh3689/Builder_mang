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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;
    const body = await request.json();

    try {
      const updated = await prisma.venture.update({
        where: { id: ventureId },
        data: body,
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
