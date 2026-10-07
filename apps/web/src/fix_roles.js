const fs = require('fs');
const envStr = fs.readFileSync('e:\\Builder_mang\\apps\\web\\.env', 'utf8');
const match = envStr.match(/DATABASE_URL="([^"]+)"/);
if (match) {
  process.env.DATABASE_URL = match[1];
} else {
  const match2 = envStr.match(/DATABASE_URL=(.+)/);
  if (match2) process.env.DATABASE_URL = match2[1].trim();
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'MANAGER' WHERE "role" = 'PROJECT_MANAGER'`);
  await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'SUPERVISOR' WHERE "role" = 'SITE_ENGINEER'`);
  console.log('Fixed old roles');
}
main().catch(console.error).finally(() => prisma.$disconnect());
