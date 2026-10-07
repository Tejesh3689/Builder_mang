import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role verification
    const { hasPermission } = await import('@/lib/permissions');
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'materials:issue')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { ventureId, fromLocationId, requestId, items, purpose, issuedToName } = body;

    if (!ventureId || !fromLocationId || !items || !items.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Venture Access Check
    if (userRole !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: { include: { assignments: { where: { ventureId, status: 'ACTIVE' } } } } }
      });
      const isAssigned = (user?.employee?.assignments?.length ?? 0) > 0;
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: 'Forbidden: Out of Venture Scope' }, { status: 403 });
      }
    }

    // Validate quantities strictly
    for (const item of items) {
      const qty = parseFloat(item.issuedQuantity);
      if (isNaN(qty) || qty <= 0 || !isFinite(qty)) {
        return NextResponse.json({ success: false, error: 'Invalid issued quantity: must be positive numeric value' }, { status: 400 });
      }
    }

    // Generate Issue Number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const issueNumber = `ISSUE-${timestamp}${random}`;

    // Execute atomic transaction for stock deduction
    const result = await prisma.$transaction(async (tx) => {
      // Create MaterialIssue record
      const newIssue = await tx.materialIssue.create({
        data: {
          issueNumber,
          ventureId,
          fromLocationId,
          requestId,
          issuedToName,
          purpose,
          issuedById: userId,
          items: {
            create: items.map((item: any) => ({
              materialId: item.materialId,
              requestedQuantity: parseFloat(item.requestedQuantity || '0') || null,
              issuedQuantity: parseFloat(item.issuedQuantity)
            }))
          }
        }
      });

      // Deduct stock safely with race-condition prevention
      for (const item of items) {
        const qty = parseFloat(item.issuedQuantity);

        // We use an optimistic lock via updateMany
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

        // If zero rows were updated, stock is insufficient (or record doesn't exist)
        if (res.count === 0) {
          throw new Error(`Insufficient stock for material ${item.materialId}`);
        }

        // Add a MaterialTransaction record
        await tx.materialTransaction.create({
          data: {
            transactionNumber: `TXN-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
            materialId: item.materialId,
            ventureId,
            stockLocationId: fromLocationId,
            transactionType: 'ISSUE',
            quantityIn: 0,
            quantityOut: qty,
            balanceAfter: 0, // In reality, we'd want to query the exact balance, but Prisma doesn't return the updated record from updateMany. We skip logging accurate balanceAfter for now or do an extra query if needed.
            referenceType: 'ISSUE',
            referenceId: newIssue.id,
            performedById: userId
          }
        });
      }

            // If a Request ID was provided, mark it as FULFILLED if appropriate
      if (requestId) {
        const reqDoc = await tx.materialRequest.findUnique({
          where: { id: requestId },
          include: { items: true }
        });

        if (reqDoc) {
          if (reqDoc.status !== 'APPROVED' && reqDoc.status !== 'PARTIALLY_ISSUED') {
            throw new Error('Conflict: Request is not in a valid state to be issued');
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
              
              if (currentIssued > updatedItem.approvedQuantity) {
                throw new Error(`Conflict: Cannot issue more than approved quantity for material ${reqItem.materialId}`);
              }
            }

            if (currentIssued >= reqItem.approvedQuantity && reqItem.approvedQuantity > 0) {
               anyIssued = true;
            } else if (currentIssued > 0) {
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
      }\n\n      return newIssue;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error issuing materials:', error);
    if (error.message.startsWith('Insufficient stock')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
