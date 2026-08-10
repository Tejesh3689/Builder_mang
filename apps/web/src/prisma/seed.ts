import { PrismaClient, UserRole, VentureStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Units of Measure
  const bags = await prisma.unitOfMeasure.upsert({
    where: { name: 'Bags' },
    update: {},
    create: { name: 'Bags' },
  });

  const kg = await prisma.unitOfMeasure.upsert({
    where: { name: 'Kg' },
    update: {},
    create: { name: 'Kg' },
  });

  // 2. Create Material Categories
  const structural = await prisma.materialCategory.upsert({
    where: { name: 'Structural' },
    update: {},
    create: { name: 'Structural' },
  });

  // 3. Create Sample Materials
  const cement = await prisma.material.upsert({
    where: { code: 'MAT-CEM' },
    update: {},
    create: {
      name: 'OPC Cement 53 Grade',
      code: 'MAT-CEM',
      categoryId: structural.id,
      unitOfMeasureId: bags.id,
      description: 'Standard Portland Cement',
    },
  });

  // 4. Create Ventures
  const ventureA = await prisma.venture.upsert({
    where: { code: 'VEN-A' },
    update: {},
    create: {
      name: 'Venture Heights Phase 1',
      code: 'VEN-A',
      location: 'Downtown City Center',
      status: VentureStatus.ACTIVE,
    },
  });

  // 5. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@builder.com' },
    update: {},
    create: {
      email: 'admin@builder.com',
      passwordHash: '$2b$10$w8.15tJtZ1Z3bH1t7o7eO.5mB7B4y2K0Xn1jTj4Y15E.zQd5G3t1.', // mock hash
      name: 'Super Admin',
      role: UserRole.ADMIN,
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@builder.com' },
    update: {},
    create: {
      email: 'engineer@builder.com',
      passwordHash: '$2b$10$w8.15tJtZ1Z3bH1t7o7eO.5mB7B4y2K0Xn1jTj4Y15E.zQd5G3t1.',
      name: 'John Site Engineer',
      role: UserRole.SITE_ENGINEER,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@builder.com' },
    update: {},
    create: {
      email: 'manager@builder.com',
      passwordHash: '$2b$10$w8.15tJtZ1Z3bH1t7o7eO.5mB7B4y2K0Xn1jTj4Y15E.zQd5G3t1.',
      name: 'Sarah Project Manager',
      role: UserRole.PROJECT_MANAGER,
    },
  });

  // 6. Create Employee records
  const empA = await prisma.employee.upsert({
    where: { employeeId: 'EMP-001' },
    update: {},
    create: {
      employeeId: 'EMP-001',
      userId: engineer.id,
      firstName: 'John',
      lastName: 'Doe',
      designation: 'Site Engineer',
      department: 'Operations',
    },
  });

  const empB = await prisma.employee.upsert({
    where: { employeeId: 'EMP-002' },
    update: {},
    create: {
      employeeId: 'EMP-002',
      userId: manager.id,
      firstName: 'Sarah',
      lastName: 'Smith',
      designation: 'Project Manager',
      department: 'Management',
    },
  });

  // 7. Assign Employees to Ventures
  await prisma.employeeVentureAssignment.upsert({
    where: { employeeId_ventureId: { employeeId: empA.id, ventureId: ventureA.id } },
    update: {},
    create: {
      employeeId: empA.id,
      ventureId: ventureA.id,
      roleAtSite: 'Lead Engineer',
    },
  });

  // 8. Create Chat Rooms and add members
  const chatRoomA = await prisma.chatRoom.upsert({
    where: { ventureId: ventureA.id },
    update: {},
    create: {
      ventureId: ventureA.id,
      name: 'Venture Heights Chat Room',
    },
  });

  await prisma.chatMember.upsert({
    where: { roomId_userId: { roomId: chatRoomA.id, userId: engineer.id } },
    update: {},
    create: { roomId: chatRoomA.id, userId: engineer.id },
  });

  // 9. Initial Material Stock
  await prisma.materialStock.upsert({
    where: { materialId_ventureId: { materialId: cement.id, ventureId: ventureA.id } },
    update: {},
    create: {
      materialId: cement.id,
      ventureId: ventureA.id,
      quantity: 100, // 100 bags opening
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
