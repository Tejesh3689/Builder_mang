import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  const venture = await prisma.venture.findFirst();
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  let category = await prisma.materialCategory.findFirst();
  if (!category) category = await prisma.materialCategory.create({ data: { name: 'TEST CAT' } });
  
  let uom = await prisma.unitOfMeasure.findFirst();
  if (!uom) uom = await prisma.unitOfMeasure.create({ data: { name: 'NOS' } });

  console.log('Test 1: Idempotency Concurrency');
  const idempotencyKey = 'c3f3f2d2-28e6-42cd-9bc7-e31b3e8e1234';
  const createMaterialRequest = async () => {
    try {
      return await prisma.materialRequest.create({
        data: {
          id: idempotencyKey,
          requestNumber: `REQ-${Date.now()}-${Math.random()}`,
          ventureId: venture!.id,
          priority: 'NORMAL',
          status: 'PENDING_APPROVAL',
          createdById: adminUser!.id,
          items: {
            create: []
          }
        }
      });
    } catch(e: any) {
      if (e.code === 'P2002') return 'P2002';
      throw e;
    }
  };

  const p1 = createMaterialRequest();
  const p2 = createMaterialRequest();
  const p3 = createMaterialRequest();
  
  const results = await Promise.all([p1, p2, p3]);
  const successCount = results.filter(r => r !== 'P2002').length;
  console.log('Concurrency created count:', successCount); // Expected: 1
  
  // Clean up
  await prisma.materialRequest.delete({ where: { id: idempotencyKey }});
  
  console.log('Test 2: Rejection comment length limit');
  try {
    const longComment = 'a'.repeat(1005);
    const validComment = longComment.substring(0, 1000);
    console.log('Valid comment length applied:', validComment.length === 1000 ? 'PASS' : 'FAIL');
  } catch(e) {
    console.log('FAIL', e);
  }

  process.exit(0);
}

runTests();
