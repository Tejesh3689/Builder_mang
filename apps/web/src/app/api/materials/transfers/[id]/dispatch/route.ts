import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const user = await requireAuth();
    const transferId = params.id;

    const { hasPermission } = await import('@/lib/permissions');
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'materials:issue')) {
      throw new ApiError(403, 'Forbidden');
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Enforce state transition DRAFT -> DISPATCHED atomically
        const transfer = await tx.materialTransfer.updateMany({
          where: { id: transferId, status: 'DRAFT' },
          data: { status: 'DISPATCHED', dispatchedById: (user as any).id, dispatchDate: new Date() }
        });

        if (transfer.count === 0) {
           throw new ApiError(409, 'Transfer is not in DRAFT state or does not exist');
        }

        const trf = await tx.materialTransfer.findUnique({
          where: { id: transferId },
          include: { items: true }
        });

        if (!trf) throw new ApiError(404, 'Not found');

        for (const item of trf.items) {
          const qty = new Prisma.Decimal(item.dispatchedQuantity as any);
          if (qty.lte(0)) throw new ApiError(400, 'Invalid quantity');

          // Decrement stock
          const stock = await tx.materialStock.updateMany({
             where: {
                materialId: item.materialId,
                stockLocationId: trf.fromLocationId,
                availableQuantity: { gte: qty }
             },
             data: {
                availableQuantity: { decrement: qty },
                physicalQuantity: { decrement: qty }
             }
          });

          if (stock.count === 0) throw new ApiError(409, 'Insufficient stock for dispatch');

          const currentStock = await tx.materialStock.findUnique({
             where: { materialId_stockLocationId: { materialId: item.materialId, stockLocationId: trf.fromLocationId } }
          });

          await tx.materialTransaction.create({
             data: {
               transactionNumber: `TXN-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
               materialId: item.materialId,
               ventureId: trf.ventureId,
               stockLocationId: trf.fromLocationId,
               transactionType: 'TRANSFER_OUT',
               quantityIn: 0,
               quantityOut: qty,
               balanceAfter: currentStock!.availableQuantity,
               referenceType: 'TRANSFER',
               referenceId: trf.id,
               performedById: (user as any).id
             }
          });
        }
        return trf;
      }, { timeout: 15000 });
      return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
