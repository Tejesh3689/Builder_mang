import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    
    // Only ADMIN or MANAGER can archive ventures
    if (!session || (userRole !== 'ADMIN' && userRole !== 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or Project Manager access required' }, 
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    // Archive the venture
    const updated = await prisma.venture.update({
      where: { id: ventureId },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        archivedBy: userId,
      }
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'Archived Venture',
        details: `Venture ${ventureId} was archived.`,
        ventureId: ventureId
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to archive venture:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
