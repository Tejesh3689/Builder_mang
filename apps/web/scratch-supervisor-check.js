const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    where: { reportingManager: { not: null } },
    select: { id: true, reportingManager: true }
  });

  console.log(`Found ${employees.length} employees with reportingManager populated.`);
  
  if (employees.length === 0) {
    console.log('No data to analyze. Safe automatic migration to reportingManagerId is blocked because we cannot determine mappings.');
  }

  // Group reportingManager names
  const managers = new Set(employees.map(e => e.reportingManager));
  console.log(`Unique reportingManager names: ${managers.size}`);
  
  // Try to find matching users or employees
  for (const name of managers) {
    const userMatches = await prisma.user.count({ where: { name } });
    const empMatches = await prisma.employee.count({ where: { OR: [{ firstName: name }, { lastName: name }] } });
    console.log(`Manager "${name}": Found ${userMatches} Users, ${empMatches} Employees.`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
