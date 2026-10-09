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
    
    let body;
    try {
      body = await req.json();
    } catch(e) {
      return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
    }
    const { action, comments } = body;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ success: false, error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });
    }

    if (action === 'REJECT') {
      if (!comments || comments.trim().length === 0) {
        return NextResponse.json({ success: false, error: 'Rejection reason is required in comments' }, { status: 400 });
      }
      if (comments.length > 1000) {
        return NextResponse.json({ success: false, error: 'Rejection reason is too long (max 1000 characters)' }, { status: 400 });
      }
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
    const { hasPermission } = await import('@/lib/permissions');
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'materials:approve')) {
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

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    
    try {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.materialRequest.updateMany({
          where: { id, status: 'PENDING_APPROVAL' },
          data: { status: newStatus }
        });

        if (updated.count === 0) {
          throw new Error('Conflict: Request is no longer pending approval or not found');
        }

        if (action === 'APPROVE') {
          const bodyItems = Array.isArray(body.items) ? body.items : [];
          for (const item of request.items) {
            const bodyItem = bodyItems.find((i: any) => i.materialId === item.materialId);
            const approvedQty = (bodyItem && typeof bodyItem.approvedQuantity === 'number') 
              ? bodyItem.approvedQuantity 
              : item.requestedQuantity;
              
            await tx.materialRequestItem.update({
              where: { id: item.id },
              data: { approvedQuantity: approvedQty }
            });
          }
        }

        await tx.materialApproval.create({
          data: {
            requestId: id,
            approverId: userId,
            action: newStatus,
            comments: comments ? comments.substring(0, 1000) : null
          }
        });
      });
    } catch(e: any) {
      if (e.message.startsWith('Conflict')) {
        return NextResponse.json({ success: false, error: e.message }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({ success: true, message: `Request ${newStatus}` });
  } catch (error: any) {
    console.error('Error in material request approval:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
