import { NextResponse } from 'next/server';
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
          transferNumber: `TRF-${timestamp}${random}`,
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
