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

    const { ventureId, fromLocationId, requestId, items, purpose, issuedToName, idempotencyKey } = body;

    if (!ventureId || !fromLocationId || !items || !items.length || !idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new ApiError(400, 'Missing required fields including idempotencyKey');
    }

    // Role verification
    const { hasPermission } = await import('@/lib/permissions');
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'materials:issue')) {
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
    const location = await prisma.stockLocation.findUnique({ where: { id: fromLocationId } });
    if (!location) throw new ApiError(404, 'ISSUE_LOCATION_NOT_FOUND');
    if (location.status !== 'ACTIVE') throw new ApiError(409, 'ISSUE_LOCATION_INACTIVE');
    if (location.ventureId !== ventureId) throw new ApiError(403, 'ISSUE_LOCATION_OUT_OF_SCOPE');

    // Material Validations
    const materialIds = items.map((i: any) => i.materialId);
    const materials = await prisma.material.findMany({ where: { id: { in: materialIds } } });
    if (materials.length !== materialIds.length) throw new ApiError(404, 'ISSUE_MATERIAL_NOT_FOUND');
    
    for (const mat of materials) {
      if (mat.status !== 'ACTIVE') throw new ApiError(409, 'ISSUE_MATERIAL_INACTIVE');
    }

    for (const item of items) {
      const qty = parseFloat(item.issuedQuantity);
      if (isNaN(qty) || qty <= 0 || !isFinite(qty)) {
        throw new ApiError(400, 'Invalid issued quantity: must be positive numeric value');
      }
    }

    // Request Verification if passed
    if (requestId) {
      const reqDoc = await prisma.materialRequest.findUnique({
        where: { id: requestId },
        include: { items: true }
      });

      if (!reqDoc) throw new ApiError(404, 'ISSUE_REQUEST_NOT_FOUND');
      if (reqDoc.ventureId !== ventureId) throw new ApiError(403, 'ISSUE_REQUEST_OUT_OF_SCOPE');
      if (reqDoc.status !== 'APPROVED' && reqDoc.status !== 'PARTIALLY_ISSUED') {
        throw new ApiError(409, 'ISSUE_REQUEST_NOT_APPROVED');
      }

      for (const item of items) {
        const matchingReqItem = reqDoc.items.find(i => i.materialId === item.materialId);
        if (!matchingReqItem) throw new ApiError(400, 'Material not in request');
        
        const qty = parseFloat(item.issuedQuantity);
        if (matchingReqItem.issuedQuantity.add(qty).gt(matchingReqItem.approvedQuantity)) {
           throw new ApiError(409, 'ISSUE_EXCEEDS_APPROVED_QUANTITY');
        }
      }
    }

    const timestamp = Date.now().toString().slice(-6);
    const random = randomBytes(3).toString('hex').toUpperCase();
    const issueNumber = `ISSUE-${timestamp}${random}`;

    try {
      const result = await runTransaction(async (tx) => {
        // Create Issue Record
        const newIssue = await tx.materialIssue.create({
          data: {
            id: typeof idempotencyKey === 'string' && idempotencyKey.length === 36 ? idempotencyKey : undefined,
            issueNumber,
            ventureId,
            fromLocationId,
            requestId,
            issuedToName,
            purpose,
            issuedById: (user as any).id,
            items: {
              create: items.map((item: any) => ({
                materialId: item.materialId,
                requestedQuantity: parseFloat(item.requestedQuantity || '0') || null,
                issuedQuantity: parseFloat(item.issuedQuantity)
              }))
            }
          }
        });

        // Deduct Stock and update ledger
        for (const item of items) {
          const qty = parseFloat(item.issuedQuantity);
          
          const res = await tx.materialStock.updateMany({
            where: {
              materialId: item.materialId,
              stockLocationId: fromLocationId,
              ventureId,
              availableQuantity: { gte: qty }
            },
            data: {
              availableQuantity: { decrement: qty },
              physicalQuantity: { decrement: qty }
            }
          });

          if (res.count === 0) {
            throw new ApiError(409, 'ISSUE_EXCEEDS_AVAILABLE_STOCK');
          }

          const currentStock = await tx.materialStock.findFirst({
            where: { materialId: item.materialId, stockLocationId: fromLocationId, ventureId }
          });

          await tx.materialTransaction.create({
            data: {
              transactionNumber: `TXN-${Date.now().toString().slice(-6)}${randomBytes(3).toString('hex').toUpperCase()}`,
              materialId: item.materialId,
              ventureId,
              stockLocationId: fromLocationId,
              transactionType: 'ISSUE',
              quantityIn: 0,
              quantityOut: qty,
              balanceAfter: currentStock ? currentStock.physicalQuantity : 0,
              referenceType: 'ISSUE',
              referenceId: newIssue.id,
              performedById: (user as any).id
            }
          });
        }

        // Request Item and Status Updates
        if (requestId) {
          const reqDoc = await tx.materialRequest.findUnique({
            where: { id: requestId },
            include: { items: true }
          });

          if (reqDoc) {
            if (reqDoc.status !== 'APPROVED' && reqDoc.status !== 'PARTIALLY_ISSUED') {
              throw new ApiError(409, 'ISSUE_REQUEST_NOT_APPROVED');
            }

            let allFullyIssued = true;
            let anyIssued = false;

            for (const reqItem of reqDoc.items) {
              const payloadItem = items.find((i: any) => i.materialId === reqItem.materialId);
              const addedQty = payloadItem ? parseFloat(payloadItem.issuedQuantity) : 0;
              let currentIssued = reqItem.issuedQuantity;

              if (addedQty > 0) {
                const updatedItem = await tx.materialRequestItem.update({
                  where: { id: reqItem.id },
                  data: { issuedQuantity: { increment: addedQty } }
                });
                currentIssued = updatedItem.issuedQuantity;
                
                if (currentIssued.gt(updatedItem.approvedQuantity)) {
                  throw new ApiError(409, 'ISSUE_EXCEEDS_APPROVED_QUANTITY');
                }
              }

              if (currentIssued.gte(reqItem.approvedQuantity) && reqItem.approvedQuantity.gt(0)) {
                 anyIssued = true;
              } else if (currentIssued.gt(0)) {
                 allFullyIssued = false;
                 anyIssued = true;
              } else {
                 allFullyIssued = false;
              }
            }

            let newStatus = reqDoc.status;
            if (allFullyIssued) newStatus = 'ISSUED';
            else if (anyIssued) newStatus = 'PARTIALLY_ISSUED';
            else newStatus = 'APPROVED';

            if (newStatus !== reqDoc.status) {
              await tx.materialRequest.update({
                where: { id: requestId },
                data: { status: newStatus }
              });
            }
          }
        }
        return newIssue;
      });
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('id')) {
         const existing = await prisma.materialIssue.findUnique({
            where: { id: idempotencyKey },
            include: { items: true }
         });
         
         let isSame = existing && existing.ventureId === ventureId && existing.fromLocationId === fromLocationId && existing.requestId === (requestId || null);
         if (isSame && existing!.items.length === items.length) {
            for (const item of items) {
               const existItem = existing!.items.find(i => i.materialId === item.materialId);
               if (!existItem || !existItem.issuedQuantity.equals(item.issuedQuantity)) {
                  isSame = false;
                  break;
               }
            }
         } else {
            isSame = false;
         }

         if (!isSame) {
            throw new ApiError(409, 'ISSUE_IDEMPOTENCY_CONFLICT');
         }

         return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }
      throw e;
    }
  } catch (error: any) {
    return handleApiError(error);
  }
}
