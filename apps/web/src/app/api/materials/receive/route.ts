import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';
import { runTransaction } from '@/lib/transaction';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    let body;
    try {
      body = await parseJsonSafe(req);
    } catch(e) {
      throw new ApiError(400, 'Malformed JSON');
    }

    const { ventureId, stockLocationId, items, vendorName, invoiceNumber, receiptDate, idempotencyKey } = body;
    const fromLocationId = stockLocationId;

    if (!ventureId || !stockLocationId || !items || !items.length || !idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new ApiError(400, 'Missing required fields including idempotencyKey');
    }

    let parsedDate = new Date();
    if (receiptDate) {
      parsedDate = new Date(receiptDate);
      if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
        throw new ApiError(400, 'Invalid or future receipt date');
      }
    }

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
        where: { AND: [{ id: ventureId }, scopedWhere] }
      });
      if (!v) throw new ApiError(403, 'Forbidden: Out of Venture Scope');
    }

    // Location Check
    const location = await prisma.stockLocation.findUnique({ where: { id: stockLocationId } });
    if (!location) throw new ApiError(404, 'RECEIVE_LOCATION_NOT_FOUND');
    if (location.status !== 'ACTIVE') throw new ApiError(409, 'RECEIVE_LOCATION_INACTIVE');
    if (location.ventureId !== ventureId) throw new ApiError(403, 'RECEIVE_LOCATION_OUT_OF_SCOPE');

    // Material Validations
    const materialIds = items.map((i: any) => i.materialId);
    const materials = await prisma.material.findMany({ where: { id: { in: materialIds } } });
    if (materials.length !== materialIds.length) throw new ApiError(404, 'RECEIVE_MATERIAL_NOT_FOUND');
    
    for (const mat of materials) {
      if (mat.status !== 'ACTIVE') throw new ApiError(409, 'RECEIVE_MATERIAL_INACTIVE');
    }

    for (const item of items) {
      const rQty = parseFloat(item.receivedQuantity);
      const aQty = parseFloat(item.acceptedQuantity);
      const rejQty = parseFloat(item.rejectedQuantity);
      
      if (isNaN(rQty) || rQty <= 0) throw new ApiError(400, 'Invalid received quantity');
      if (isNaN(aQty) || aQty < 0) throw new ApiError(400, 'Invalid accepted quantity');
      if (isNaN(rejQty) || rejQty < 0) throw new ApiError(400, 'Invalid rejected quantity');
      if (Math.abs(rQty - (aQty + rejQty)) > 0.001) throw new ApiError(400, 'Received quantity must equal accepted + rejected');
    }

    const timestamp = Date.now().toString().slice(-6);
    const random = randomBytes(3).toString('hex').toUpperCase();
    const receiptNumber = `GRN-${timestamp}${random}`;

    try {
      const result = await runTransaction(async (tx) => {
        // Create Receipt Record
        const newReceipt = await tx.materialReceipt.create({
          data: {
            id: typeof idempotencyKey === 'string' && idempotencyKey.length === 36 ? idempotencyKey : undefined,
            receiptNumber,
            vendorName,
            invoiceNumber,
            receiptDate: parsedDate,
            ventureId,
            stockLocationId,
            receivedById: (user as any).id,
            items: {
              create: items.map((item: any) => {
                 const rQty = parseFloat(item.receivedQuantity);
                 const aQty = parseFloat(item.acceptedQuantity);
                 const rejQty = parseFloat(item.rejectedQuantity);
                 return {
                    materialId: item.materialId,
                    receivedQuantity: rQty,
                    acceptedQuantity: aQty,
                    rejectedQuantity: rejQty,
                    rate: item.rate ? parseFloat(item.rate) : null
                 };
              })
            }
          }
        });

        // Deduct Stock and update ledger
        for (const item of items) {
          const aQty = parseFloat(item.acceptedQuantity);
          
          if (aQty > 0) {
            const currentStock = await tx.materialStock.upsert({
              where: {
                materialId_stockLocationId: {
                  materialId: item.materialId,
                  stockLocationId: fromLocationId
                }
              },
              update: {
                availableQuantity: { increment: aQty },
                physicalQuantity: { increment: aQty }
              },
              create: {
                materialId: item.materialId,
                stockLocationId: fromLocationId,
                ventureId,
                availableQuantity: aQty,
                physicalQuantity: aQty,
                reservedQuantity: 0
              }
            });

<<<<<<< HEAD
            await tx.materialTransaction.create({
              data: {
                transactionNumber: `TXN-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
                materialId: item.materialId,
                ventureId,
                stockLocationId: fromLocationId,
                transactionType: 'RECEIPT',
                quantityIn: aQty,
                quantityOut: 0,
                balanceAfter: currentStock.availableQuantity,
                referenceType: 'RECEIPT',
                referenceId: newReceipt.id,
                performedById: (user as any).id
              }
            });
          }
=======
          await tx.materialTransaction.create({
            data: {
              transactionNumber: `TXN-${Date.now().toString().slice(-6)}${randomBytes(3).toString('hex').toUpperCase()}`,
              materialId: item.materialId,
              ventureId,
              stockLocationId: fromLocationId,
              transactionType: 'RECEIPT',
              quantityIn: qty,
              quantityOut: 0,
              balanceAfter: currentStock ? currentStock.physicalQuantity : 0,
              referenceType: 'RECEIPT',
              referenceId: newReceipt.id,
              performedById: (user as any).id
            }
          });
>>>>>>> 8a59970cc7c464760e8dc508544fefaf9202eff9
        }

        return newReceipt;
      });
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('id')) {
         const existing = await prisma.materialReceipt.findUnique({
            where: { id: idempotencyKey },
            include: { items: true }
         });
         
         let isSame = existing && existing.ventureId === ventureId && existing.stockLocationId === stockLocationId && true;
         if (isSame && existing!.items.length === items.length) {
            for (const item of items) {
               const existItem = existing!.items.find(i => i.materialId === item.materialId);
               if (!existItem || !existItem.receivedQuantity.equals(item.receivedQuantity)) {
                  isSame = false;
                  break;
               }
            }
         } else {
            isSame = false;
         }

         if (!isSame) {
            throw new ApiError(409, 'RECEIVE_IDEMPOTENCY_CONFLICT');
         }

         return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }
      throw e;
    }
  } catch (error: any) {
    return handleApiError(error);
  }
}
