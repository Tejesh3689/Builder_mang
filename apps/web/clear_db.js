const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data cleanup...');
  
  // Delete all material related data first to satisfy foreign key constraints
  await prisma.materialApproval.deleteMany({});
  await prisma.materialRequestItem.deleteMany({});
  await prisma.materialRequest.deleteMany({});
  
  await prisma.materialReceiptItem.deleteMany({});
  await prisma.materialReceipt.deleteMany({});
  
  await prisma.materialIssueItem.deleteMany({});
  await prisma.materialIssue.deleteMany({});
  
  await prisma.materialTransferItem.deleteMany({});
  await prisma.materialTransfer.deleteMany({});
  
  await prisma.materialReturnItem.deleteMany({});
  await prisma.materialReturn.deleteMany({});
  
  await prisma.stockAdjustmentItem.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  
  await prisma.materialConsumptionItem.deleteMany({});
  await prisma.materialConsumption.deleteMany({});
  
  await prisma.materialTransaction.deleteMany({});
  await prisma.materialStock.deleteMany({});
  await prisma.stockLocation.deleteMany({});
  await prisma.materialAttachment.deleteMany({});

  // Now delete materials
  const materialsDeleted = await prisma.material.deleteMany({});
  console.log(`Deleted ${materialsDeleted.count} materials`);
  
  await prisma.materialSubcategory.deleteMany({});
  await prisma.materialCategory.deleteMany({});
  await prisma.unitOfMeasure.deleteMany({});

  // Now delete ventures and employees
  await prisma.employeeVentureAssignment.deleteMany({});
  
  const venturesDeleted = await prisma.venture.deleteMany({});
  console.log(`Deleted ${venturesDeleted.count} ventures`);

  await prisma.employeeDocument.deleteMany({});
  await prisma.employeeSkill.deleteMany({});
  await prisma.employeeCertification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  
  const employeesDeleted = await prisma.employee.deleteMany({});
  console.log(`Deleted ${employeesDeleted.count} employees`);
  
  console.log('Cleanup complete. Ready for fresh data entry.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
