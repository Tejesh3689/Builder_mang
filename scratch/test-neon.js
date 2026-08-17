const { PrismaClient } = require('../apps/web/node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_EtV7nexaHI5h@ep-noisy-math-axwiausl.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
    }
  }
});
async function main() {
  const employees = await prisma.employee.findMany();
  console.log("Employees count:", employees.length);
  console.log(employees.map(e => ({ id: e.id, employeeId: e.employeeId, name: `${e.firstName} ${e.lastName}` })));
  
  const ventures = await prisma.venture.findMany();
  console.log("Ventures count:", ventures.length);
  console.log(ventures.map(v => ({ id: v.id, name: v.name, code: v.code })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
