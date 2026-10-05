const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    include: {
      user: true,
      assignments: { include: { venture: true } }
    }
  });

  const users = await prisma.user.findMany();

  console.log('Employee ID | Employee Name | userId | reportingManager | Matching User ID | Matching Employee ID | Venture assignments | Current role | Data classification');
  console.log('-'.repeat(150));

  let valid = 0, invalid = 0, ambiguous = 0;

  for (const emp of employees) {
    const name = `${emp.firstName} ${emp.lastName}`.trim();
    const rm = emp.reportingManager;
    let matchUserIds = [];
    let matchEmpIds = [];
    let classification = '';

    if (!rm) {
      classification = 'B (Null)';
      invalid++;
    } else if (rm === 'undefined' || !rm.trim()) {
      classification = 'C (Invalid placeholder)';
      invalid++;
    } else {
      // Find matching user
      const uMatches = users.filter(u => u.name?.toLowerCase().trim() === rm.toLowerCase().trim());
      matchUserIds = uMatches.map(u => u.id);

      // Find matching employee
      const eMatches = employees.filter(e => {
        const eName = `${e.firstName} ${e.lastName}`.trim().toLowerCase();
        return eName === rm.toLowerCase().trim() || e.firstName.toLowerCase() === rm.toLowerCase().trim();
      });
      matchEmpIds = eMatches.map(e => e.id);

      if (matchUserIds.length === 0 && matchEmpIds.length === 0) {
        classification = 'D (No match)';
        invalid++;
      } else if (matchUserIds.length > 1 || matchEmpIds.length > 1) {
        classification = 'E (Multiple matches)';
        ambiguous++;
      } else {
        classification = 'A (Valid/Resolvable)';
        valid++;
      }
    }

    // Role
    const role = emp.user?.role || 'NO_USER';
    const ventures = emp.assignments.map(a => a.venture.name).join(', ') || 'None';

    console.log(`${emp.employeeId} | ${name} | ${emp.userId || 'N/A'} | "${rm}" | ${matchUserIds.join(', ')} | ${matchEmpIds.join(', ')} | ${ventures} | ${role} | ${classification}`);
  }

  console.log('\n--- SUMMARY ---');
  console.log(`Total Employees: ${employees.length}`);
  console.log(`Valid mappings: ${valid}`);
  console.log(`Invalid mappings: ${invalid}`);
  console.log(`Ambiguous mappings: ${ambiguous}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
