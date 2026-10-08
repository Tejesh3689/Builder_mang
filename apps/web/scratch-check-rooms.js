const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.chatRoom.findMany();
  console.dir(rooms, { depth: null });
  const assignments = await prisma.employeeVentureAssignment.findMany();
  console.dir(assignments, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
