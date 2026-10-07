const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  try {
    const res = await prisma.user.updateMany({
      where: { role: 'STORE_MANAGER' },
      data: { role: 'SUPERVISOR' }
    });
    console.log('Updated rows:', res);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
update();
