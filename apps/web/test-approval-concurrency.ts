import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- MATERIAL APPROVAL CONCURRENCY TEST ---');
  
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const venture = await prisma.venture.findFirst();

  // Create a PENDING_APPROVAL request
  const req = await prisma.materialRequest.create({
    data: {
      requestNumber: `REQ-TEST-${Date.now()}`,
      ventureId: venture!.id,
      status: 'PENDING_APPROVAL',
      createdById: adminUser!.id
    }
  });

  const approveRequest = async (requestName: string) => {
    try {
      const res = await prisma.materialRequest.updateMany({
        where: { id: req.id, status: 'PENDING_APPROVAL' },
        data: { status: 'APPROVED' }
      });
      if (res.count === 0) {
        throw new Error('Conflict: Request is no longer pending approval');
      }
      await prisma.materialApproval.create({
        data: { requestId: req.id, approverId: adminUser!.id, action: 'APPROVED' }
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  console.log('Running two concurrent material approvals...');
  const [res1, res2] = await Promise.all([
    approveRequest('A'),
    approveRequest('B')
  ]);

  console.log(`Req A: ${res1.success ? 'SUCCESS' : res1.error}`);
  console.log(`Req B: ${res2.success ? 'SUCCESS' : res2.error}`);

  const finalReq = await prisma.materialRequest.findUnique({ where: { id: req.id }, include: { approvals: true } });

  console.log(`Final status: ${finalReq?.status}`);
  console.log(`Approval record count: ${finalReq?.approvals.length}`);

  await prisma.materialRequest.delete({ where: { id: req.id } });
  await prisma.$disconnect();
}

runTests().catch(console.error);
