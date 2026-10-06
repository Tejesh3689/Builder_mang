import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  const venture = await prisma.venture.findFirst();
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const location = await prisma.stockLocation.findFirst();
  const material = await prisma.material.findFirst();

  const runIssueTransaction = async (requestName: string, quantity: number) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const res = await tx.materialStock.updateMany({
          where: { materialId: material!.id, stockLocationId: location!.id, ventureId: venture!.id, availableQuantity: { gte: quantity } },
          data: { availableQuantity: { decrement: quantity }, physicalQuantity: { decrement: quantity } }
        });
        if (res.count === 0) throw new Error(`Insufficient stock for material ${material!.id}`);
        return await tx.materialIssue.create({
          data: {
            issueNumber: `ISSUE-TEST-${Date.now()}-${Math.random()}`,
            ventureId: venture!.id,
            fromLocationId: location!.id,
            issuedById: adminUser!.id,
            items: { create: [{ materialId: material!.id, issuedQuantity: quantity }] }
          }
        });
      }, { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 10000 });
      return { success: true, result };
    } catch (e: any) {
      console.log(`[${requestName}] ERROR:`, e.message);
      return { success: false, error: e.message };
    }
  };

  const setStock = async (qty: number) => {
    await prisma.materialStock.upsert({
      where: { materialId_stockLocationId: { materialId: material!.id, stockLocationId: location!.id } },
      update: { availableQuantity: qty, physicalQuantity: qty, ventureId: venture!.id },
      create: { materialId: material!.id, stockLocationId: location!.id, ventureId: venture!.id, availableQuantity: qty, physicalQuantity: qty }
    });
  };

  const getStock = async () => {
    const s = await prisma.materialStock.findUnique({ where: { materialId_stockLocationId: { materialId: material!.id, stockLocationId: location!.id } } });
    return s?.availableQuantity;
  };

  console.log('\n--- 2. EXACT-STOCK CONCURRENCY TEST ---');
  await setStock(100);
  const [res1, res2] = await Promise.all([runIssueTransaction('A', 50), runIssueTransaction('B', 50)]);
  console.log(`Req A: ${res1.success}`, `Req B: ${res2.success}`);
  console.log(`Final stock: ${await getStock()}`);

  await prisma.materialIssue.deleteMany({ where: { issueNumber: { startsWith: 'ISSUE-TEST-' } } });
  await prisma.$disconnect();
}

runTests().catch(console.error);
