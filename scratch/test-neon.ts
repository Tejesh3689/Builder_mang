import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_EtV7nexaHI5h@ep-noisy-math-axwiausl.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function main() {
  console.log("Connecting to Neon DB...");
  const employees = await prisma.employee.findMany();
  console.log(`Found ${employees.length} employees:`);
  console.log(employees.map(e => ({ id: e.id, employeeId: e.employeeId, firstName: e.firstName, lastName: e.lastName })));
  
  const ventures = await prisma.venture.findMany();
  console.log(`Found ${ventures.length} ventures:`);
  console.log(ventures.map(v => ({ id: v.id, name: v.name, code: v.code })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
