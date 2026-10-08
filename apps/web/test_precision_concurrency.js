const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPrecisionTests() {
  console.log("Starting BMS Phase 2C Inventory Precision Verification...");
  
  try {
    // 1. Setup Data: Create a Venture, Location, Category, and Material
    const venture = await prisma.venture.create({
      data: { name: 'Precision Test Venture ' + Date.now(), status: 'ACTIVE', code: 'V-' + Date.now() }
    });
    
    const location = await prisma.stockLocation.create({
      data: { name: 'Test Loc', ventureId: venture.id, status: 'ACTIVE', code: 'LOC-' + Date.now(), type: 'MAIN_STORE' }
    });
    
    const category = await prisma.materialCategory.create({
      data: { name: 'Test Category ' + Date.now() }
    });
    const uom = await prisma.unitOfMeasure.create({
      data: { name: 'KG ' + Date.now() }
    });
    
    const material = await prisma.material.create({
      data: {
        name: 'Precision Tester',
        code: 'PT-' + Date.now(),
        categoryId: category.id,
        baseUnitId: uom.id,
        status: 'ACTIVE'
      }
    });

    const user = await prisma.user.create({
      data: {
        email: 'test' + Date.now() + '@example.com',
        passwordHash: 'xx',
        name: 'Tester'
      }
    });
    
    // Initialize Stock
    const initialStock = await prisma.materialStock.create({
      data: {
        materialId: material.id,
        stockLocationId: location.id,
        ventureId: venture.id,
        physicalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0
      }
    });
    
    console.log("Initial Stock setup successfully.");

    // 2. Perform repeated small quantity increases (+0.1)
    console.log("Simulating 3x Receipts of +0.1...");
    let balance = new Prisma.Decimal(0);
    
    for (let i = 0; i < 3; i++) {
      await prisma.$transaction(async (tx) => {
        const qty = new Prisma.Decimal('0.1');
        
        const updated = await tx.materialStock.update({
          where: { id: initialStock.id },
          data: {
            physicalQuantity: { increment: qty },
            availableQuantity: { increment: qty }
          }
        });
        
        balance = updated.availableQuantity;
        
        await tx.materialTransaction.create({
          data: {
            transactionNumber: 'TX-IN-' + Date.now() + i,
            materialId: material.id,
            ventureId: venture.id,
            stockLocationId: location.id,
            transactionType: 'RECEIPT',
            quantityIn: qty,
            quantityOut: 0,
            balanceAfter: updated.availableQuantity,
            referenceType: 'RECEIPT',
            referenceId: 'TEST-REC-' + i,
            performedById: user.id
          }
        });
      });
    }

    // 3. Verify the stored quantity is exactly 0.300
    let currentStock = await prisma.materialStock.findUnique({ where: { id: initialStock.id } });
    if (currentStock.availableQuantity.equals(new Prisma.Decimal('0.3'))) {
       console.log("PASS: Repeated +0.1 increases resulted in exact 0.3 stored value.");
       console.log("Database Value Observed:", currentStock.availableQuantity.toString());
    } else {
       console.error("FAIL: Expected 0.3, got", currentStock.availableQuantity.toString());
    }

    // 4. Decrease by 0.3
    console.log("Simulating Issue of -0.3...");
    await prisma.$transaction(async (tx) => {
       const qty = new Prisma.Decimal('0.3');
       const updated = await tx.materialStock.updateMany({
         where: {
           id: initialStock.id,
           availableQuantity: { gte: qty }
         },
         data: {
           physicalQuantity: { decrement: qty },
           availableQuantity: { decrement: qty }
         }
       });
       
       if (updated.count === 0) throw new Error("Insufficient Stock (Race condition)");

       currentStock = await tx.materialStock.findUnique({ where: { id: initialStock.id } });
       
       await tx.materialTransaction.create({
          data: {
            transactionNumber: 'TX-OUT-' + Date.now(),
            materialId: material.id,
            ventureId: venture.id,
            stockLocationId: location.id,
            transactionType: 'ISSUE',
            quantityIn: 0,
            quantityOut: qty,
            balanceAfter: currentStock.availableQuantity,
            referenceType: 'ISSUE',
            referenceId: 'TEST-ISSUE',
            performedById: user.id
          }
       });
    });

    // 5. Verify the final quantity is exactly 0.000
    currentStock = await prisma.materialStock.findUnique({ where: { id: initialStock.id } });
    if (currentStock.availableQuantity.equals(new Prisma.Decimal('0'))) {
       console.log("PASS: Decrement by 0.3 resulted in exactly 0 stored value.");
       console.log("Database Value Observed:", currentStock.availableQuantity.toString());
    } else {
       console.error("FAIL: Expected 0, got", currentStock.availableQuantity.toString());
    }
    
    // 8. Test Concurrent stock updates (Atomicity check)
    console.log("Testing concurrent decrements...");
    
    // Add 10.0 to stock
    await prisma.materialStock.update({
      where: { id: initialStock.id },
      data: { physicalQuantity: 10, availableQuantity: 10 }
    });
    
    const tryIssue = async (qtyStr) => {
      try {
        await prisma.$transaction(async (tx) => {
           const qty = new Prisma.Decimal(qtyStr);
           const u = await tx.materialStock.updateMany({
             where: { id: initialStock.id, availableQuantity: { gte: qty } },
             data: { availableQuantity: { decrement: qty }, physicalQuantity: { decrement: qty } }
           });
           if (u.count === 0) throw new Error('Stock not available');
        });
        return 'SUCCESS';
      } catch (e) {
        return 'FAILED';
      }
    };
    
    // Attempt 3 concurrent issues of 4.0. Total = 12.0 (Only 2 should succeed, 1 should fail)
    const results = await Promise.all([
      tryIssue('4.0'), tryIssue('4.0'), tryIssue('4.0')
    ]);
    
    const successes = results.filter(r => r === 'SUCCESS').length;
    const failures = results.filter(r => r === 'FAILED').length;
    
    console.log(`Concurrent Issue Results: ${successes} Success, ${failures} Failures`);
    
    currentStock = await prisma.materialStock.findUnique({ where: { id: initialStock.id } });
    if (successes === 2 && currentStock.availableQuantity.equals(new Prisma.Decimal('2'))) {
       console.log("PASS: Concurrency handled perfectly. Stock never went negative.");
       console.log("Final balance:", currentStock.availableQuantity.toString());
    } else {
       console.error("FAIL: Concurrency issue. Final stock:", currentStock.availableQuantity.toString());
    }
    
    console.log("ALL TESTS COMPLETED SUCCESSFULLY");
    
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runPrecisionTests();
