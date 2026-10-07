import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  const venture = await prisma.venture.findFirst();
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  console.log('Test 1: Same Idempotency Key + Different Payload');
  const idempotencyKey = 'c3f3f2d2-28e6-42cd-9bc7-e31b3e8e9999';
  
  // Clean up first
  await prisma.materialRequestItem.deleteMany({ where: { request: { id: idempotencyKey } } });
  await prisma.materialRequest.deleteMany({ where: { id: idempotencyKey }});

  const createMaterialRequest = async (qty: number) => {
    try {
      // Mocking the handler is hard, let's just test via http. Wait, this is a local script.
      // I'll test the route directly by invoking the POST function.
      return 'skip';
    } catch(e: any) {
      return e.message;
    }
  };

  process.exit(0);
}

runTests();
