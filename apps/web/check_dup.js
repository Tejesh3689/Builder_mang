const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ventures = await prisma.venture.findMany();
  const names = {};
  ventures.forEach(v => {
    names[v.name] = (names[v.name] || 0) + 1;
  });
  console.log('Duplicate names:', Object.entries(names).filter(([k,v]) => v > 1));
}
main().finally(() => prisma.$disconnect());
