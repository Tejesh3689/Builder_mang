import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, comments } = body; // APPROVE, REJECT

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ success: false, error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });
    }

    // Load request
    const request = await prisma.materialRequest.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Material request not found' }, { status: 404 });
    }

    // Role verification (Admin or Project Manager)
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'STORE_MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // If manager, verify venture assignment
    if (userRole !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: { include: { assignments: { where: { ventureId: request.ventureId, status: 'ACTIVE' } } } } }
      });
      const isAssigned = (user?.employee?.assignments?.length ?? 0) > 0;
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: 'Forbidden: Out of Venture Scope' }, { status: 403 });
      }
    }

    // We use updateMany for atomicity and checking state transitions
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    
    const res = await prisma.materialRequest.updateMany({
      where: { id, status: 'PENDING_APPROVAL' },
      data: { status: newStatus }
    });

    if (res.count === 0) {
      return NextResponse.json({ success: false, error: 'Conflict: Request is no longer pending approval or not found' }, { status: 409 });
    }

    // Create the approval record
    await prisma.materialApproval.create({
      data: {
        requestId: id,
        approverId: userId,
        action: newStatus,
        comments
      }
    });

    return NextResponse.json({ success: true, message: `Request ${newStatus}` });
  } catch (error: any) {
    console.error('Error in material request approval:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
