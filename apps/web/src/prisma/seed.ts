import { PrismaClient, UserRole, VentureStatus, VentureType, DocumentCategory, AnnouncementPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Production Venture data...');

  // 1. Create Units of Measure
  const bags = await prisma.unitOfMeasure.upsert({
    where: { name: 'Bags' },
    update: {},
    create: { name: 'Bags' },
  });

  const tons = await prisma.unitOfMeasure.upsert({
    where: { name: 'Tons' },
    update: {},
    create: { name: 'Tons' },
  });

  const boxes = await prisma.unitOfMeasure.upsert({
    where: { name: 'Boxes' },
    update: {},
    create: { name: 'Boxes' },
  });

  // 2. Create Material Categories
  const structural = await prisma.materialCategory.upsert({
    where: { name: 'Structural' },
    update: {},
    create: { name: 'Structural' },
  });

  const finishing = await prisma.materialCategory.upsert({
    where: { name: 'Finishing' },
    update: {},
    create: { name: 'Finishing' },
  });

  // 3. Create Sample Materials
  const cement = await prisma.material.upsert({
    where: { code: 'MAT-CEM-53' },
    update: {},
    create: {
      name: 'OPC Cement 53 Grade',
      code: 'MAT-CEM-53',
      categoryId: structural.id,
      baseUnitId: bags.id,
      description: 'Ultratech 53 Grade High Strength Cement',
    },
  });

  const steel = await prisma.material.upsert({
    where: { code: 'MAT-STL-12' },
    update: {},
    create: {
      name: 'TMT Steel Rebars 12mm',
      code: 'MAT-STL-12',
      categoryId: structural.id,
      baseUnitId: tons.id,
      description: 'Fe 550D High Ductility Steel Bars',
    },
  });

  const tiles = await prisma.material.upsert({
    where: { code: 'MAT-TIL-VIT' },
    update: {},
    create: {
      name: 'Vitrified Floor Tiles 600x600',
      code: 'MAT-TIL-VIT',
      categoryId: finishing.id,
      baseUnitId: boxes.id,
      description: 'Kajaria Glossy Finish Premium Tiles',
    },
  });

  // 4. Create Users & Employees
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@builder.com' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'admin@builder.com',
      passwordHash: defaultPasswordHash,
      name: 'Rajesh Kumar',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@builder.com' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'manager@builder.com',
      passwordHash: defaultPasswordHash,
      name: 'Suresh Verma',
      role: UserRole.PROJECT_MANAGER,
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@builder.com' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'engineer@builder.com',
      passwordHash: defaultPasswordHash,
      name: 'Ajay Site Engineer',
      role: UserRole.SITE_ENGINEER,
    },
  });

  const storeUser = await prisma.user.upsert({
    where: { email: 'store@builder.com' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'store@builder.com',
      passwordHash: defaultPasswordHash,
      name: 'Vikram Storekeeper',
      role: UserRole.STORE_MANAGER,
    },
  });

  const emp1 = await prisma.employee.upsert({
    where: { employeeId: 'EMP-001' },
    update: { userId: admin.id },
    create: {
      employeeId: 'EMP-001',
      userId: admin.id,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      designation: 'Project Director',
      department: 'Management',
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { employeeId: 'EMP-002' },
    update: { userId: manager.id },
    create: {
      employeeId: 'EMP-002',
      userId: manager.id,
      firstName: 'Suresh',
      lastName: 'Verma',
      designation: 'Senior Project Manager',
      department: 'Construction',
    },
  });

  const emp3 = await prisma.employee.upsert({
    where: { employeeId: 'EMP-003' },
    update: { userId: engineer.id },
    create: {
      employeeId: 'EMP-003',
      userId: engineer.id,
      firstName: 'Ajay',
      lastName: 'Rao',
      designation: 'Lead Site Engineer',
      department: 'Engineering',
    },
  });

  const emp4 = await prisma.employee.upsert({
    where: { employeeId: 'EMP-004' },
    update: { userId: storeUser.id },
    create: {
      employeeId: 'EMP-004',
      userId: storeUser.id,
      firstName: 'Vikram',
      lastName: 'Singh',
      designation: 'Store & Materials Manager',
      department: 'Logistics',
    },
  });

  // 5. Create Ventures with Full Operational Fields
  const greenHeights = await prisma.venture.upsert({
    where: { code: 'VNT-2026-001' },
    update: {},
    create: {
      name: 'Green Heights Luxury Apartments',
      code: 'VNT-2026-001',
      type: VentureType.RESIDENTIAL,
      description: 'Modern 14-storey residential towers with underground parking and rooftop gardens.',
      status: VentureStatus.ACTIVE,
      regAddressLine1: 'Plot 45, Commercial Complex',
      regCity: 'Vijayawada',
      regDistrict: 'Krishna',
      regState: 'Andhra Pradesh',
      regPincode: '520008',
      siteAddressLine1: 'Beside National Highway 16, Benz Circle',
      siteCity: 'Vijayawada',
      siteDistrict: 'Krishna',
      siteState: 'Andhra Pradesh',
      sitePincode: '520010',
      latitude: 16.5062,
      longitude: 80.6480,
      planningStartDate: new Date('2025-10-01'),
      startDate: new Date('2026-01-15'),
      expectedCompletionDate: new Date('2027-12-31'),
      estimatedBudget: 82000000, // Rs. 8.2 Crore
      progressPercentage: 68,
      projectDirectorId: emp1.id,
      projectManagerId: emp2.id,
      siteManagerId: emp3.id,
      purchaseManagerId: emp4.id,
    },
  });

  const skylineVillas = await prisma.venture.upsert({
    where: { code: 'VNT-2026-002' },
    update: {},
    create: {
      name: 'Skyline Gated Villas',
      code: 'VNT-2026-002',
      type: VentureType.VILLA,
      description: 'Exclusive 40-unit duplex villa community featuring smart home automation.',
      status: VentureStatus.ACTIVE,
      regAddressLine1: 'Tower B, Corporate Park',
      regCity: 'Guntur',
      regState: 'Andhra Pradesh',
      siteAddressLine1: 'Inner Ring Road, Phase 2',
      siteCity: 'Guntur',
      siteState: 'Andhra Pradesh',
      sitePincode: '522002',
      latitude: 16.3067,
      longitude: 80.4365,
      startDate: new Date('2026-02-01'),
      expectedCompletionDate: new Date('2027-08-30'),
      estimatedBudget: 54000000, // Rs. 5.4 Crore
      progressPercentage: 42,
      projectManagerId: emp2.id,
      siteManagerId: emp3.id,
    },
  });

  // 6. Venture Settings
  await prisma.ventureSetting.upsert({
    where: { ventureId: greenHeights.id },
    update: {},
    create: {
      ventureId: greenHeights.id,
      minStockThresholdDefault: 50,
      requireMaterialApproval: true,
      allowFileUploadInChat: true,
      notifyOnLowStock: true,
    },
  });

  // 7. Venture Team Assignments
  await prisma.employeeVentureAssignment.upsert({
    where: { employeeId_ventureId: { employeeId: emp2.id, ventureId: greenHeights.id } },
    update: {},
    create: {
      employeeId: emp2.id,
      ventureId: greenHeights.id,
      roleAtSite: 'Project Manager',
      accessLevel: 'FULL_PROJECT_ACCESS',
    },
  });

  await prisma.employeeVentureAssignment.upsert({
    where: { employeeId_ventureId: { employeeId: emp3.id, ventureId: greenHeights.id } },
    update: {},
    create: {
      employeeId: emp3.id,
      ventureId: greenHeights.id,
      roleAtSite: 'Site Engineer',
      accessLevel: 'OPERATIONS_ACCESS',
    },
  });

  await prisma.employeeVentureAssignment.upsert({
    where: { employeeId_ventureId: { employeeId: emp4.id, ventureId: greenHeights.id } },
    update: {},
    create: {
      employeeId: emp4.id,
      ventureId: greenHeights.id,
      roleAtSite: 'Store Manager',
      accessLevel: 'MATERIAL_ACCESS',
    },
  });

  // 8. Material Stocks
  const mainStore = await prisma.stockLocation.upsert({
    where: {
      ventureId_code: {
        ventureId: greenHeights.id,
        code: 'MAIN'
      }
    },
    update: {},
    create: {
      ventureId: greenHeights.id,
      code: 'MAIN',
      name: 'Main Storage Site A',
      type: 'MAIN_STORE',
      status: 'ACTIVE'
    }
  });

  await prisma.materialStock.upsert({
    where: { materialId_stockLocationId: { materialId: cement.id, stockLocationId: mainStore.id } },
    update: { physicalQuantity: 420, availableQuantity: 420 },
    create: {
      materialId: cement.id,
      ventureId: greenHeights.id,
      stockLocationId: mainStore.id,
      physicalQuantity: 420,
      availableQuantity: 420,
    },
  });

  await prisma.materialStock.upsert({
    where: { materialId_stockLocationId: { materialId: steel.id, stockLocationId: mainStore.id } },
    update: { physicalQuantity: 8.4, availableQuantity: 8.4 },
    create: {
      materialId: steel.id,
      ventureId: greenHeights.id,
      stockLocationId: mainStore.id,
      physicalQuantity: 8.4,
      availableQuantity: 8.4,
    },
  });

  await prisma.materialStock.upsert({
    where: { materialId_stockLocationId: { materialId: tiles.id, stockLocationId: mainStore.id } },
    update: { physicalQuantity: 320, availableQuantity: 320 },
    create: {
      materialId: tiles.id,
      ventureId: greenHeights.id,
      stockLocationId: mainStore.id,
      physicalQuantity: 320,
      availableQuantity: 320,
    },
  });

  // 9. Documents & Announcements
  await prisma.ventureDocument.createMany({
    skipDuplicates: true,
    data: [
      {
        ventureId: greenHeights.id,
        title: 'Municipal Building Approval Plan.pdf',
        category: DocumentCategory.APPROVALS,
        fileUrl: '/documents/green-heights-approval.pdf',
        fileType: 'application/pdf',
        fileSize: 4500000,
        version: '2.1',
      },
      {
        ventureId: greenHeights.id,
        title: 'Structural Design & Foundation Blueprints.dwg',
        category: DocumentCategory.DRAWINGS,
        fileUrl: '/documents/structural-blueprints.dwg',
        fileType: 'image/vnd.dwg',
        fileSize: 12400000,
        version: '1.0',
      },
      {
        ventureId: greenHeights.id,
        title: 'Environmental Impact Certificate.pdf',
        category: DocumentCategory.LEGAL,
        fileUrl: '/documents/env-certificate.pdf',
        fileType: 'application/pdf',
        fileSize: 2100000,
        version: '1.0',
      },
    ],
  });

  await prisma.ventureAnnouncement.createMany({
    skipDuplicates: true,
    data: [
      {
        ventureId: greenHeights.id,
        title: 'Safety Audit & Crane Inspection Scheduled',
        message: 'Third-party heavy machinery inspection will take place on Friday 9:00 AM. Ensure site clearance.',
        priority: AnnouncementPriority.HIGH,
        audience: 'ALL',
      },
      {
        ventureId: greenHeights.id,
        title: 'TMT Steel Bulk Dispatch Arriving Tomorrow',
        message: 'Logistics team to prepare bay 3 for 15-ton offloading at 7:00 AM.',
        priority: AnnouncementPriority.NORMAL,
        audience: 'SITE_STAFF',
      },
    ],
  });

  // 10. Scoped Chat Rooms
  const chatGeneral = await prisma.chatRoom.create({
    data: {
      ventureId: greenHeights.id,
      name: 'General Discussion',
    },
  });

  const chatSiteTeam = await prisma.chatRoom.create({
    data: {
      ventureId: greenHeights.id,
      name: 'Site Engineers & Ops',
    },
  });

  await prisma.chatMessage.create({
    data: {
      roomId: chatGeneral.id,
      senderId: manager.id,
      content: 'Welcome everyone! Tower B slab casting is scheduled for this Thursday.',
    },
  });

  await prisma.chatMessage.create({
    data: {
      roomId: chatSiteTeam.id,
      senderId: engineer.id,
      content: 'Cement stock verified (420 bags). Ready for morning batching operation.',
    },
  });

  // 11. Audit Activity Log
  await prisma.auditLog.createMany({
    data: [
      {
        userId: manager.id,
        ventureId: greenHeights.id,
        action: 'MATERIAL_REQUEST_APPROVED',
        details: 'Approved Material Request MR-1024 for 100 bags OPC Cement',
      },
      {
        userId: engineer.id,
        ventureId: greenHeights.id,
        action: 'STOCK_ISSUED',
        details: 'Issued 50 bags Cement to Tower A Phase 2 Slab',
      },
      {
        userId: admin.id,
        ventureId: greenHeights.id,
        action: 'EMPLOYEE_ASSIGNED',
        details: 'Assigned Vikram Singh as Store Manager to Green Heights',
      },
    ],
  });

  console.log('Production Venture data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

