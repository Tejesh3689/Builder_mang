import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const user = await requireAuth();
    const transferId = params.id;
    const body = await parseJsonSafe(req);
    const { items } = body;

    const { hasPermission } = await import('@/lib/permissions');
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'materials:receive')) {
      throw new ApiError(403, 'Forbidden');
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find existing to check scope
        const trfCheck = await tx.materialTransfer.findUnique({ where: { id: transferId } });
        if (!trfCheck) throw new ApiError(404, 'Not found');
        
        if ((user as any).role !== 'ADMIN') {
          const scopedWhere = await buildScopedWhere(user, 'venture');
          if (scopedWhere.id === 'DENY_ALL') throw new ApiError(403, 'Forbidden');
          const toLoc = await tx.stockLocation.findUnique({ where: { id: trfCheck.toLocationId } });
          const v = await tx.venture.findFirst({
            where: { AND: [{ id: toLoc!.ventureId }, scopedWhere] }
          });
          if (!v) throw new ApiError(403, 'Forbidden: Destination location out of Venture Scope');
        }

        const transfer = await tx.materialTransfer.updateMany({
          where: { id: transferId, status: { in: ['DISPATCHED', 'IN_TRANSIT'] } },
          data: { status: 'COMPLETED', receivedById: (user as any).id, receiveDate: new Date() }
        });

        if (transfer.count === 0) {
           throw new ApiError(409, 'Transfer is not in DISPATCHED state');
        }

        for (const inputItem of items) {
          const rQty = new Prisma.Decimal(inputItem.receivedQuantity);
          const dQty = new Prisma.Decimal(inputItem.damagedQuantity || 0);

          if (rQty.lt(0) || dQty.lt(0)) throw new ApiError(400, 'Invalid received quantity');

          await tx.materialTransferItem.update({
             where: { id: inputItem.itemId },
             data: { receivedQuantity: rQty, damagedQuantity: dQty }
          });

          // Increment destination stock for rQty
          const currentStock = await tx.materialStock.upsert({
             where: {
                materialId_stockLocationId: {
                   materialId: inputItem.materialId,
                   stockLocationId: trfCheck.toLocationId
                }
             },
             update: {
                availableQuantity: { increment: rQty },
                physicalQuantity: { increment: rQty }
             },
             create: {
                materialId: inputItem.materialId,
                stockLocationId: trfCheck.toLocationId,
                ventureId: trfCheck.ventureId, // assuming same venture or explicitly setting
                availableQuantity: rQty,
                physicalQuantity: rQty,
                reservedQuantity: 0
             }
          });

          await tx.materialTransaction.create({
             data: {
               transactionNumber: `TXN-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
               materialId: inputItem.materialId,
               ventureId: trfCheck.ventureId,
               stockLocationId: trfCheck.toLocationId,
               transactionType: 'TRANSFER_IN',
               quantityIn: rQty,
               quantityOut: 0,
               balanceAfter: currentStock.availableQuantity,
               referenceType: 'TRANSFER',
               referenceId: trfCheck.id,
               performedById: (user as any).id
             }
          });
        }
        return await tx.materialTransfer.findUnique({ where: { id: transferId } });
      }, { timeout: 15000 });
      return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
