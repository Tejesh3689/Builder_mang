const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const res = await prisma.$executeRawUnsafe(`UPDATE users SET "role" = 'SUPERVISOR' WHERE "role" = 'STORE_MANAGER'`);
    console.log(res);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
check();
