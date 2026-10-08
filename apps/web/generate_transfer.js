const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app/api/materials/transfers');
fs.mkdirSync(baseDir, { recursive: true });

// 1. Create DRAFT Route
const createDraftRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await parseJsonSafe(req);
    
    const { ventureId, fromLocationId, toLocationId, items, idempotencyKey } = body;
    
    if (!ventureId || !fromLocationId || !toLocationId || !items || !items.length || !idempotencyKey) {
      throw new ApiError(400, 'Missing required fields');
    }
    if (fromLocationId === toLocationId) {
      throw new ApiError(400, 'Source and destination locations cannot be the same');
    }

    const { hasPermission } = await import('@/lib/permissions');
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'materials:issue')) {
      throw new ApiError(403, 'Forbidden');
    }

    if ((user as any).role !== 'ADMIN') {
      const scopedWhere = await buildScopedWhere(user, 'venture');
      if (scopedWhere.id === 'DENY_ALL') throw new ApiError(403, 'Forbidden');
      
      const v = await prisma.venture.findFirst({
        where: { AND: [{ id: ventureId }, scopedWhere] }
      });
      if (!v) throw new ApiError(403, 'Forbidden: Out of Venture Scope');
    }

    const locations = await prisma.stockLocation.findMany({
      where: { id: { in: [fromLocationId, toLocationId] } }
    });
    
    if (locations.length !== 2) throw new ApiError(404, 'One or both locations not found');
    if (locations.some(l => l.status !== 'ACTIVE')) throw new ApiError(409, 'Location inactive');
    // Ensure fromLocation belongs to the venture
    const fromLoc = locations.find(l => l.id === fromLocationId);
    if (fromLoc?.ventureId !== ventureId) throw new ApiError(403, 'Source location out of scope');

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    try {
      const transfer = await prisma.materialTransfer.create({
        data: {
          id: idempotencyKey,
          transferNumber: \`TRF-\${timestamp}\${random}\`,
          ventureId,
          fromLocationId,
          toLocationId,
          status: 'DRAFT',
          items: {
            create: items.map((i: any) => ({
              materialId: i.materialId,
              dispatchedQuantity: i.dispatchedQuantity
            }))
          }
        }
      });
      return NextResponse.json({ success: true, data: transfer }, { status: 201 });
    } catch (e: any) {
      if (e.code === 'P2002') {
         const existing = await prisma.materialTransfer.findUnique({ where: { id: idempotencyKey } });
         if (existing) return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
`;
fs.writeFileSync(path.join(baseDir, 'route.ts'), createDraftRoute);

// 2. Dispatch Route
const dispatchDir = path.join(baseDir, '[id]/dispatch');
fs.mkdirSync(dispatchDir, { recursive: true });
const dispatchRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
               transactionNumber: \`TXN-\${Date.now().toString().slice(-6)}\${Math.floor(Math.random() * 1000)}\`,
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
`;
fs.writeFileSync(path.join(dispatchDir, 'route.ts'), dispatchRoute);

// 3. Receive Route
const receiveDir = path.join(baseDir, '[id]/receive');
fs.mkdirSync(receiveDir, { recursive: true });
const receiveRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
               transactionNumber: \`TXN-\${Date.now().toString().slice(-6)}\${Math.floor(Math.random() * 1000)}\`,
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
`;
fs.writeFileSync(path.join(receiveDir, 'route.ts'), receiveRoute);
console.log('Done');
