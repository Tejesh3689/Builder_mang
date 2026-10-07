import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { MaterialRequestSchema } from '@builder/validation';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
    }

    let parsed;
    try {
      parsed = MaterialRequestSchema.parse(body);
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.errors || 'Validation Error' }, { status: 400 });
    }

    const { ventureId, items, remarks } = parsed;
    const idempotencyKey = body.idempotencyKey; // optional UUID

    // Check Venture Scope
    if ((user as any).role !== 'ADMIN') {
      const scopedWhere = await buildScopedWhere(user, 'venture');
      if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      
      const v = await prisma.venture.findFirst({
        where: { AND: [{ id: ventureId }, scopedWhere] }
      });
      if (!v) {
         return NextResponse.json({ success: false, error: 'Forbidden: Out of Venture Scope' }, { status: 403 });
      }
    }

    // Merge duplicate materials in the request
    const mergedItemsMap = new Map<string, number>();
    for (const item of items) {
      const qty = item.quantity;
      if (!isFinite(qty) || qty <= 0) {
        return NextResponse.json({ success: false, error: 'Quantity must be positive finite number' }, { status: 400 });
      }
      mergedItemsMap.set(item.materialId, (mergedItemsMap.get(item.materialId) || 0) + qty);
    }

    const finalItems = Array.from(mergedItemsMap.entries()).map(([materialId, quantity]) => ({
      materialId, quantity
    }));

    // Check requiredDate
    const reqDateStr = body.requiredDate;
    let requiredDate = null;
    if (reqDateStr) {
       requiredDate = new Date(reqDateStr);
       if (isNaN(requiredDate.getTime())) {
         return NextResponse.json({ success: false, error: 'Invalid requiredDate' }, { status: 400 });
       }
       // Strict date-only validation - discard time
       requiredDate.setHours(0,0,0,0);
       const today = new Date();
       today.setHours(0,0,0,0);
       if (requiredDate < today) {
         return NextResponse.json({ success: false, error: 'requiredDate cannot be in the past' }, { status: 400 });
       }
    }

    // Check Materials
    const materialIds = finalItems.map(i => i.materialId);
    const materials = await prisma.material.findMany({
       where: { id: { in: materialIds } }
    });

    if (materials.length !== materialIds.length) {
       return NextResponse.json({ success: false, error: 'One or more materials do not exist' }, { status: 400 });
    }

    for (const mat of materials) {
      if (mat.status !== 'ACTIVE') {
         return NextResponse.json({ success: false, error: `Material ${mat.code} is not ACTIVE` }, { status: 400 });
      }
    }

    // Generate Request Number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const requestNumber = `REQ-${timestamp}${random}`;

    try {
      const newRequest = await prisma.$transaction(async (tx) => {
        return await tx.materialRequest.create({
          data: {
            id: typeof idempotencyKey === 'string' && idempotencyKey.length === 36 ? idempotencyKey : undefined,
            requestNumber,
            ventureId,
            priority: body.priority || 'NORMAL',
            requiredDate,
            remarks,
            status: 'PENDING_APPROVAL',
            createdById: (user as any).id,
            items: {
              create: finalItems.map(item => ({
                materialId: item.materialId,
                requestedQuantity: item.quantity
              }))
            }
          }
        });
      });
      return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('id')) {
         const existing = await prisma.materialRequest.findUnique({
            where: { id: idempotencyKey },
            include: { items: true }
         });
         
         // Compare payloads logically
         let isSame = existing && existing.ventureId === ventureId && existing.createdById === (user as any).id;
         if (isSame && existing!.items.length === finalItems.length) {
            for (const item of finalItems) {
               const existItem = existing!.items.find(i => i.materialId === item.materialId);
               if (!existItem || existItem.requestedQuantity !== item.quantity) {
                  isSame = false;
                  break;
               }
            }
         } else {
            isSame = false;
         }

         if (!isSame) {
            return NextResponse.json({ success: false, error: 'Conflict: Idempotency key already used with a different payload' }, { status: 409 });
         }

         return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }
      throw e;
    }

  } catch (error: any) {
    console.error('Error creating material request:', error);
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
