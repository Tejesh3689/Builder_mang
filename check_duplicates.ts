import { prisma } from './apps/web/src/lib/db';

async function checkDuplicates() {
  const users = await prisma.user.groupBy({
    by: ['email'],
    having: {
      email: { _count: { gt: 1 } },
    },
    _count: { email: true }
  });
  console.log('Duplicate Users (by email):', users);

  const employeesByEmail = await prisma.employee.groupBy({
    by: ['email'],
    having: {
      email: { _count: { gt: 1 } },
    },
    _count: { email: true }
  });
  console.log('Duplicate Employees (by email):', employeesByEmail);

  const employeesByPhone = await prisma.employee.groupBy({
    by: ['phone'],
    having: {
      phone: { _count: { gt: 1 } },
    },
    _count: { phone: true }
  });
  console.log('Duplicate Employees (by phone):', employeesByPhone.filter(e => e.phone !== null && e.phone !== ''));

  const venturesByName = await prisma.venture.groupBy({
    by: ['name'],
    having: {
      name: { _count: { gt: 1 } },
    },
    _count: { name: true }
  });
  console.log('Duplicate Ventures (by name):', venturesByName);

  process.exit(0);
}

checkDuplicates().catch(console.error);
