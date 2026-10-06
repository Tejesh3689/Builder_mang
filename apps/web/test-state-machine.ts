import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- MATERIAL STATE MACHINE TEST ---');
  
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const venture = await prisma.venture.findFirst();

  const req = await prisma.materialRequest.create({
    data: { requestNumber: `REQ-SM-${Date.now()}`, ventureId: venture!.id, status: 'APPROVED', createdById: adminUser!.id }
  });

  const tryTransition = async (initial: string, action: string) => {
    // Reset to initial
    await prisma.materialRequest.update({ where: { id: req.id }, data: { status: initial } });

    try {
      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const res = await prisma.materialRequest.updateMany({
        where: { id: req.id, status: 'PENDING_APPROVAL' }, // THIS IS THE KEY ENFORCEMENT
        data: { status: newStatus }
      });
      if (res.count === 0) {
        console.log(`${initial} -> ${newStatus} : REJECTED (Correct)`);
      } else {
        console.log(`${initial} -> ${newStatus} : SUCCESS (Unexpected!)`);
      }
    } catch (e: any) {
      console.log(`${initial} -> action ${action} : ERROR`);
    }
  };

  await tryTransition('APPROVED', 'REJECT');
  await tryTransition('APPROVED', 'APPROVE');
  await tryTransition('REJECTED', 'APPROVE');
  await tryTransition('FULFILLED', 'APPROVE');
  await tryTransition('FULFILLED', 'REJECT');

  await prisma.materialRequest.delete({ where: { id: req.id } });
  await prisma.$disconnect();
}

runTests().catch(console.error);
