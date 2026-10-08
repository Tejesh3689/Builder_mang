import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { handleApiError, ApiError } from '@/lib/api-errors';
import { uploadMaterialAttachment } from '@/services/material-attachment.service';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const user = await requireAuth();
    const receiptId = params.id;

    // Verify receipt exists and user has scope
    const receipt = await prisma.materialReceipt.findUnique({
      where: { id: receiptId },
      include: { venture: true }
    });

    if (!receipt) throw new ApiError(404, 'RECEIPT_NOT_FOUND');

    // Role verification
    const { hasPermission } = await import('@/lib/permissions');
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'materials:receive')) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions');
    }

    // Venture Access Check
    if ((user as any).role !== 'ADMIN') {
      const scopedWhere = await buildScopedWhere(user, 'venture');
      if (scopedWhere.id === 'DENY_ALL') throw new ApiError(403, 'Forbidden');
      
      const v = await prisma.venture.findFirst({
        where: { AND: [{ id: receipt.ventureId }, scopedWhere] }
      });
      if (!v) throw new ApiError(403, 'Forbidden: Out of Venture Scope');
    }

    const form = await req.formData();
    const attachment = await uploadMaterialAttachment(user, 'RECEIPT', receiptId, form);

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
