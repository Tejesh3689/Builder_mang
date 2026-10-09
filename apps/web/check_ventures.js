const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ventures = await prisma.venture.findMany();
  console.log('Ventures:');
  console.table(ventures.map(v => ({ id: v.id, name: v.name, code: v.code })));
}
main().finally(() => prisma.$disconnect());
