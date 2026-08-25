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
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    // ADMIN can see any venture's materials.
    // Other roles must be assigned to the venture.
    if (userRole !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: { include: { assignments: { where: { ventureId, status: 'ACTIVE' } } } } }
      });
      const isAssigned = (user?.employee?.assignments?.length ?? 0) > 0;
      if (!isAssigned) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You are not assigned to this venture' },
          { status: 403 }
        );
      }
    }

    try {
      const stocks = await prisma.materialStock.findMany({
        where: { ventureId },
        include: {
          material: {
            include: { category: true, unitOfMeasure: true },
          },
        },
      });
      return NextResponse.json({ success: true, data: stocks });
    } catch (dbError: any) {
      console.error('Database error in materials GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
