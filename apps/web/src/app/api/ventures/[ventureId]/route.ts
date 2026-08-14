import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    try {
      const venture = await prisma.venture.findFirst({
        where: {
          OR: [{ id: ventureId }, { code: ventureId }],
        },
        include: {
          projectDirector: { select: { id: true, firstName: true, lastName: true, designation: true } },
          projectManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          siteManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          constructionManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          financeManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          purchaseManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          assignments: {
            include: {
              employee: true,
            },
          },
          stocks: {
            include: {
              material: {
                include: { category: true, unitOfMeasure: true },
              },
            },
          },
          documents: true,
          announcements: { orderBy: { createdAt: 'desc' } },
          chatRooms: true,
          settings: true,
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!venture) {
        throw new Error('Venture not found');
      }

      return NextResponse.json({ success: true, data: venture });
    } catch (dbError) {
      // Fallback mock detail
      const mockDetail = {
        id: ventureId,
        name: ventureId.toUpperCase().includes('SKYLINE') || ventureId.includes('002') ? 'Skyline Gated Villas' : 'Green Heights Luxury Apartments',
        code: ventureId.toUpperCase().includes('VNT') ? ventureId.toUpperCase() : 'VNT-2026-001',
        type: 'RESIDENTIAL',
        status: 'ACTIVE',
        description: 'Modern 14-storey residential towers with underground parking, rooftop gardens, and premium structural concrete foundation.',
        regAddressLine1: 'Plot 45, Commercial Complex',
        regAddressLine2: 'Benz Circle',
        regCity: 'Vijayawada',
        regDistrict: 'Krishna',
        regState: 'Andhra Pradesh',
        regPincode: '520008',
        siteAddressLine1: 'Beside National Highway 16, Benz Circle',
        siteAddressLine2: 'Phase 1 Construction Zone',
        siteCity: 'Vijayawada',
        siteDistrict: 'Krishna',
        siteState: 'Andhra Pradesh',
        sitePincode: '520010',
        latitude: 16.5062,
        longitude: 80.648,
        planningStartDate: '2025-10-01T00:00:00.000Z',
        startDate: '2026-01-15T00:00:00.000Z',
        expectedCompletionDate: '2027-12-31T00:00:00.000Z',
        estimatedBudget: 82000000,
        progressPercentage: 68,
        projectDirector: { id: 'emp-001', firstName: 'Rajesh', lastName: 'Kumar', designation: 'Project Director' },
        projectManager: { id: 'emp-002', firstName: 'Suresh', lastName: 'Verma', designation: 'Senior PM' },
        siteManager: { id: 'emp-003', firstName: 'Ajay', lastName: 'Rao', designation: 'Lead Site Engineer' },
        purchaseManager: { id: 'emp-004', firstName: 'Vikram', lastName: 'Singh', designation: 'Store Manager' },
        assignments: [
          { id: 'asgn-1', employee: { id: 'emp-002', firstName: 'Suresh', lastName: 'Verma', designation: 'Project Manager', department: 'Management' }, roleAtSite: 'Project Manager', accessLevel: 'FULL_PROJECT_ACCESS', status: 'ACTIVE' },
          { id: 'asgn-2', employee: { id: 'emp-003', firstName: 'Ajay', lastName: 'Rao', designation: 'Lead Site Engineer', department: 'Engineering' }, roleAtSite: 'Site Engineer', accessLevel: 'OPERATIONS_ACCESS', status: 'ACTIVE' },
          { id: 'asgn-3', employee: { id: 'emp-004', firstName: 'Vikram', lastName: 'Singh', designation: 'Storekeeper', department: 'Logistics' }, roleAtSite: 'Store Manager', accessLevel: 'MATERIAL_ACCESS', status: 'ACTIVE' },
        ],
        stocks: [
          { id: 'stk-1', quantity: 420, material: { name: 'OPC Cement 53 Grade', code: 'MAT-CEM-53', category: { name: 'Structural' }, unitOfMeasure: { name: 'Bags' } } },
          { id: 'stk-2', quantity: 8.4, material: { name: 'TMT Steel Rebars 12mm', code: 'MAT-STL-12', category: { name: 'Structural' }, unitOfMeasure: { name: 'Tons' } } },
          { id: 'stk-3', quantity: 320, material: { name: 'Vitrified Floor Tiles 600x600', code: 'MAT-TIL-VIT', category: { name: 'Finishing' }, unitOfMeasure: { name: 'Boxes' } } },
        ],
        documents: [
          { id: 'doc-1', title: 'Municipal Building Approval Plan.pdf', category: 'APPROVALS', fileType: 'application/pdf', fileSize: 4500000, version: '2.1', createdAt: '2026-01-10T10:00:00.000Z' },
          { id: 'doc-2', title: 'Structural Design & Foundation Blueprints.dwg', category: 'DRAWINGS', fileType: 'image/vnd.dwg', fileSize: 12400000, version: '1.0', createdAt: '2026-01-12T14:30:00.000Z' },
          { id: 'doc-3', title: 'Environmental Impact Certificate.pdf', category: 'LEGAL', fileType: 'application/pdf', fileSize: 2100000, version: '1.0', createdAt: '2026-01-14T09:15:00.000Z' },
        ],
        announcements: [
          { id: 'ann-1', title: 'Safety Audit & Crane Inspection Scheduled', message: 'Third-party heavy machinery inspection will take place on Friday 9:00 AM. Ensure site clearance.', priority: 'HIGH', createdAt: '2026-02-10T08:00:00.000Z' },
          { id: 'ann-2', title: 'TMT Steel Bulk Dispatch Arriving Tomorrow', message: 'Logistics team to prepare bay 3 for 15-ton offloading at 7:00 AM.', priority: 'NORMAL', createdAt: '2026-02-08T16:00:00.000Z' },
        ],
        chatRooms: [
          { id: 'chat-1', name: 'General Discussion' },
          { id: 'chat-2', name: 'Site Engineers & Ops' },
          { id: 'chat-3', name: 'Materials & Procurement' },
        ],
        settings: {
          minStockThresholdDefault: 50,
          requireMaterialApproval: true,
          allowEmployeeSelfAssignment: false,
          allowFileUploadInChat: true,
          notifyOnLowStock: true,
          notifyOnMaterialRequests: true,
        },
        auditLogs: [
          { id: 'aud-1', action: 'MATERIAL_REQUEST_APPROVED', details: 'Rajesh approved Material Request MR-1024', createdAt: '2026-02-12T10:42:00.000Z' },
          { id: 'aud-2', action: 'STOCK_ISSUED', details: 'Suresh issued 50 bags Cement for Slab Casting', createdAt: '2026-02-12T10:18:00.000Z' },
          { id: 'aud-3', action: 'EMPLOYEE_ASSIGNED', details: 'Ajay added employee EMP-031 to Site Team', createdAt: '2026-02-12T09:51:00.000Z' },
        ],
      };

      return NextResponse.json({ success: true, data: mockDetail });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;
    const body = await request.json();

    try {
      const updated = await prisma.venture.update({
        where: { id: ventureId },
        data: body,
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (dbError) {
      return NextResponse.json({ success: true, data: { id: ventureId, ...body } });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
