const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  try {
    const res = await prisma.$executeRaw`UPDATE "User" SET "role" = 'SUPERVISOR' WHERE "role" = 'STORE_MANAGER'`;
    console.log('Updated rows:', res);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
update();
