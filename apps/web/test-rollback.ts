import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- TRANSACTION ROLLBACK TEST ---');
  
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const venture = await prisma.venture.findFirst();
  const location = await prisma.stockLocation.findFirst();
  const material = await prisma.material.findFirst();

  // Create clean stock
  const stock = await prisma.materialStock.upsert({
    where: { materialId_stockLocationId: { materialId: material!.id, stockLocationId: location!.id } },
    update: { availableQuantity: 500, physicalQuantity: 500, ventureId: venture!.id },
    create: { materialId: material!.id, stockLocationId: location!.id, ventureId: venture!.id, availableQuantity: 500, physicalQuantity: 500 }
  });

  const originalStock = stock.availableQuantity;
  console.log(`Original Stock: ${originalStock}`);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Decrement stock
      await tx.materialStock.updateMany({
        where: { materialId: material!.id, stockLocationId: location!.id },
        data: { availableQuantity: { decrement: 50 }, physicalQuantity: { decrement: 50 } }
      });

      // 2. Create issue
      await tx.materialIssue.create({
        data: {
          issueNumber: `ISSUE-ROLLBACK-${Date.now()}`,
          ventureId: venture!.id,
          fromLocationId: location!.id,
          issuedById: adminUser!.id,
          items: { create: [{ materialId: material!.id, issuedQuantity: 50 }] }
        }
      });

      // 3. FORCE FAILURE
      throw new Error('SIMULATED_DOWNSTREAM_FAILURE');
    });
  } catch (e: any) {
    console.log(`Transaction threw: ${e.message}`);
  }

  const finalStock = await prisma.materialStock.findUnique({
    where: { materialId_stockLocationId: { materialId: material!.id, stockLocationId: location!.id } }
  });

  console.log(`Final Stock: ${finalStock?.availableQuantity}`);
  console.log(`Rollback successful? ${finalStock?.availableQuantity === originalStock ? 'YES' : 'NO'}`);

  const leftoverIssues = await prisma.materialIssue.count({ where: { issueNumber: { startsWith: 'ISSUE-ROLLBACK-' } } });
  console.log(`Orphan MaterialIssue count: ${leftoverIssues}`);

  await prisma.$disconnect();
}

runTests().catch(console.error);
