import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { handleApiError, ApiError } from '@/lib/api-errors';
import { downloadMaterialAttachment } from '@/services/material-attachment.service';

export async function GET(req: Request, { params }: { params: any }) {
  try {
    const user = await requireAuth();
    const { id: receiptId, attachmentId } = params;

    // Verify receipt exists and user has scope
    const receipt = await prisma.materialReceipt.findUnique({
      where: { id: receiptId },
      include: { venture: true }
    });

    if (!receipt) throw new ApiError(404, 'RECEIPT_NOT_FOUND');

    // Venture Access Check
    if ((user as any).role !== 'ADMIN') {
      const scopedWhere = await buildScopedWhere(user, 'venture');
      if (scopedWhere.id === 'DENY_ALL') throw new ApiError(403, 'Forbidden');
      
      const v = await prisma.venture.findFirst({
        where: { AND: [{ id: receipt.ventureId }, scopedWhere] }
      });
      if (!v) throw new ApiError(403, 'Forbidden: Out of Venture Scope');
    }

    const attachment = await prisma.materialAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment || attachment.entityId !== receiptId || attachment.entityType !== 'RECEIPT') {
      throw new ApiError(404, 'ATTACHMENT_NOT_FOUND');
    }

    return await downloadMaterialAttachment(attachment);
  } catch (error: any) {
    return handleApiError(error);
  }
}
