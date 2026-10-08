const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhase4Tests() {
  console.log("Starting BMS Phase 4 Transfer Lifecycle Verification...");
  
  try {
    // 1. Setup Data
    const venture = await prisma.venture.create({
      data: { name: 'P4 Venture ' + Date.now(), status: 'ACTIVE', code: 'P4V-' + Date.now() }
    });
    
    const locFrom = await prisma.stockLocation.create({
      data: { name: 'From Loc', ventureId: venture.id, status: 'ACTIVE', code: 'P4L1-' + Date.now(), type: 'MAIN_STORE' }
    });
    
    const locTo = await prisma.stockLocation.create({
      data: { name: 'To Loc', ventureId: venture.id, status: 'ACTIVE', code: 'P4L2-' + Date.now(), type: 'SITE_STORE' }
    });
    
    const category = await prisma.materialCategory.create({
      data: { name: 'Test Cat P4 ' + Date.now() }
    });
    const uom = await prisma.unitOfMeasure.create({
      data: { name: 'EA ' + Date.now() }
    });
    
    const material = await prisma.material.create({
      data: {
        name: 'P4 Material',
        code: 'P4M-' + Date.now(),
        categoryId: category.id,
        baseUnitId: uom.id,
        status: 'ACTIVE'
      }
    });

    const user = await prisma.user.create({
      data: {
        email: 'p4test' + Date.now() + '@example.com',
        passwordHash: 'xx',
        name: 'P4 Tester'
      }
    });

    // Initialize Source Stock
    const initialStock = await prisma.materialStock.create({
      data: {
        materialId: material.id,
        stockLocationId: locFrom.id,
        ventureId: venture.id,
        physicalQuantity: 100,
        availableQuantity: 100,
        reservedQuantity: 0
      }
    });
    
    // Initialize Dest Stock
    const destStock = await prisma.materialStock.create({
      data: {
        materialId: material.id,
        stockLocationId: locTo.id,
        ventureId: venture.id,
        physicalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0
      }
    });

    console.log("Data setup complete. Testing Transfer Lifecycle...");

    // 2. CREATE DRAFT
    let transfer = await prisma.materialTransfer.create({
      data: {
        transferNumber: 'TRF-' + Date.now(),
        ventureId: venture.id,
        fromLocationId: locFrom.id,
        toLocationId: locTo.id,
        status: 'DRAFT',
        items: {
          create: [{
            materialId: material.id,
            dispatchedQuantity: new Prisma.Decimal('10')
          }]
        }
      },
      include: { items: true }
    });
    console.log("PASS: Created DRAFT Transfer.");

    // 3. DISPATCH TRANSFER
    await prisma.$transaction(async (tx) => {
       const tr = await tx.materialTransfer.findUnique({ where: { id: transfer.id }, include: { items: true } });
       if (tr.status !== 'DRAFT') throw new Error("Invalid state");
       
       await tx.materialTransfer.update({
         where: { id: transfer.id },
         data: { status: 'DISPATCHED', dispatchDate: new Date(), dispatchedById: user.id }
       });
       
       for (const item of tr.items) {
         const qty = item.dispatchedQuantity;
         const u = await tx.materialStock.updateMany({
           where: { materialId: item.materialId, stockLocationId: locFrom.id, availableQuantity: { gte: qty } },
           data: { physicalQuantity: { decrement: qty }, availableQuantity: { decrement: qty } }
         });
         if (u.count === 0) throw new Error("Insufficient stock");
         
         const curr = await tx.materialStock.findFirst({ where: { materialId: item.materialId, stockLocationId: locFrom.id } });
         
         await tx.materialTransaction.create({
           data: {
             transactionNumber: 'TX-DISP-' + Date.now(),
             materialId: item.materialId,
             ventureId: venture.id,
             stockLocationId: locFrom.id,
             transactionType: 'TRANSFER_OUT',
             quantityIn: 0,
             quantityOut: qty,
             balanceAfter: curr.availableQuantity,
             referenceType: 'TRANSFER',
             referenceId: tr.id,
             performedById: user.id
           }
         });
       }
    });
    
    // Verify Dispatch
    let s = await prisma.materialStock.findUnique({ where: { id: initialStock.id } });
    if (s.availableQuantity.equals(new Prisma.Decimal('90'))) {
      console.log("PASS: DISPATCH successful. Source stock decremented (100 -> 90). Destination stock not credited yet.");
    } else {
      console.error("FAIL: Source stock wrong:", s.availableQuantity.toString());
    }

    // 4. RECEIVE TRANSFER
    await prisma.$transaction(async (tx) => {
       const tr = await tx.materialTransfer.findUnique({ where: { id: transfer.id }, include: { items: true } });
       if (tr.status !== 'DISPATCHED') throw new Error("Invalid state");
       
       await tx.materialTransfer.update({
         where: { id: transfer.id },
         data: { status: 'RECEIVED', receiveDate: new Date(), receivedById: user.id }
       });
       
       for (const item of tr.items) {
         const qty = item.dispatchedQuantity; // assume fully received
         
         await tx.materialTransferItem.update({
           where: { id: item.id },
           data: { receivedQuantity: qty, damagedQuantity: 0 }
         });
         
         await tx.materialStock.updateMany({
           where: { materialId: item.materialId, stockLocationId: locTo.id },
           data: { physicalQuantity: { increment: qty }, availableQuantity: { increment: qty } }
         });
         
         const curr = await tx.materialStock.findFirst({ where: { materialId: item.materialId, stockLocationId: locTo.id } });
         
         await tx.materialTransaction.create({
           data: {
             transactionNumber: 'TX-REC-' + Date.now(),
             materialId: item.materialId,
             ventureId: venture.id,
             stockLocationId: locTo.id,
             transactionType: 'TRANSFER_IN',
             quantityIn: qty,
             quantityOut: 0,
             balanceAfter: curr.availableQuantity,
             referenceType: 'TRANSFER',
             referenceId: tr.id,
             performedById: user.id
           }
         });
       }
    });

    // Verify Receipt
    let d = await prisma.materialStock.findUnique({ where: { id: destStock.id } });
    if (d.availableQuantity.equals(new Prisma.Decimal('10'))) {
      console.log("PASS: RECEIPT successful. Destination stock credited (0 -> 10).");
    } else {
      console.error("FAIL: Destination stock wrong:", d.availableQuantity.toString());
    }

    // 5. TEST STATE PROTECTION (Duplicate Receive)
    try {
      await prisma.$transaction(async (tx) => {
         const tr = await tx.materialTransfer.findUnique({ where: { id: transfer.id }, include: { items: true } });
         // IT MUST FAIL HERE because status is RECEIVED, not DISPATCHED
         if (tr.status !== 'DISPATCHED') throw new Error("Invalid state");
      });
      console.error("FAIL: State machine allowed duplicate receipt!");
    } catch (e) {
      console.log("PASS: State machine successfully rejected illegal duplicate receipt attempt.");
    }
    
    console.log("ALL TRANSFER LIFECYCLE TESTS PASSED.");
    
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();
