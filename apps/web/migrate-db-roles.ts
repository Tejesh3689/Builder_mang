import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Migrating legacy roles...');
  
  const res1 = await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'MANAGER' WHERE "role" = 'PROJECT_MANAGER'`);
  console.log(`Updated ${res1} PROJECT_MANAGER users to MANAGER`);

  const res2 = await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'SUPERVISOR' WHERE "role" = 'SITE_ENGINEER'`);
  console.log(`Updated ${res2} SITE_ENGINEER users to SUPERVISOR`);

  console.log('Role migration complete.');
  await prisma.$disconnect();
}

run().catch(console.error);
