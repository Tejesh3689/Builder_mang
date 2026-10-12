import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { buildSearchConditions } from '@/lib/search';
import ExcelJS from 'exceljs';
import { buildScopedWhere, requireAuth } from '@/lib/authorization';

const EXPORTABLE_MODULES = [
  'ventures',
  'transactions',
  'project-report',
  'employee-report',
  'inventory-report'
] as const;

export async function GET(req: Request, { params }: { params: Promise<{ module: string }> }) {
  try {
    const { module } = await params;
    if (!EXPORTABLE_MODULES.includes(module as any)) {
      return NextResponse.json({ success: false, error: 'Invalid module' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const user = await requireAuth();

    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.trim();
    const format = url.searchParams.get('format') || 'xlsx';

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(module.toUpperCase());

    if (module === 'ventures') {
      const and: any[] = [];
      const statusFilter = url.searchParams.get('status');
      const typeFilter = url.searchParams.get('type');
      if (statusFilter && statusFilter !== 'ALL') and.push({ status: statusFilter });
      if (typeFilter && typeFilter !== 'ALL') and.push({ type: typeFilter });
      
      if (search) {
        and.push(...buildSearchConditions(search, [
          term => ({ name: { contains: term, mode: 'insensitive' } }),
          term => ({ code: { contains: term, mode: 'insensitive' } }),
          term => ({ siteCity: { contains: term, mode: 'insensitive' } }),
          term => ({ regCity: { contains: term, mode: 'insensitive' } }),
          term => ({ projectManager: { firstName: { contains: term, mode: 'insensitive' } } }),
          term => ({ projectManager: { lastName: { contains: term, mode: 'insensitive' } } }),
          term => ({ siteManager: { firstName: { contains: term, mode: 'insensitive' } } }),
          term => ({ siteManager: { lastName: { contains: term, mode: 'insensitive' } } })
        ]));
      }

      const rows = await prisma.venture.findMany({
        where: { AND: and },
        include: {
          projectManager: { select: { firstName: true, lastName: true } },
          siteManager: { select: { firstName: true, lastName: true } },
          _count: { select: { assignments: true, stocks: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      worksheet.columns = [
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Site City', key: 'siteCity', width: 20 },
        { header: 'Project Manager', key: 'pm', width: 25 },
        { header: 'Site Manager', key: 'sm', width: 25 },
        { header: 'Team Size', key: 'teamSize', width: 15 },
      ];

      rows.forEach(r => {
        worksheet.addRow({
          code: r.code,
          name: r.name,
          status: r.status,
          type: r.type,
          siteCity: r.siteCity || '',
          pm: r.projectManager ? `${r.projectManager.firstName} ${r.projectManager.lastName}` : '',
          sm: r.siteManager ? `${r.siteManager.firstName} ${r.siteManager.lastName}` : '',
          teamSize: r._count.assignments
        });
      });
    } else if (module === 'transactions') {
      const and: any[] = [];
      const typeFilter = url.searchParams.get('type');
      if (typeFilter && typeFilter !== 'ALL') and.push({ transactionType: typeFilter });
      
      if (search) {
        and.push(...buildSearchConditions(search, [
          term => ({ transactionNumber: { contains: term, mode: 'insensitive' } }),
          term => ({ material: { name: { contains: term, mode: 'insensitive' } } }),
          term => ({ stockLocation: { name: { contains: term, mode: 'insensitive' } } }),
          term => ({ venture: { name: { contains: term, mode: 'insensitive' } } })
        ]));
      }

      const rows = await prisma.materialTransaction.findMany({
        where: { AND: and },
        include: {
          material: true,
          stockLocation: true,
          venture: true,
          performedBy: true
        },
        orderBy: { createdAt: 'desc' }
      });

      worksheet.columns = [
        { header: 'Transaction #', key: 'txNo', width: 22 },
        { header: 'Date', key: 'date', width: 16 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Material', key: 'material', width: 25 },
        { header: 'Venture', key: 'venture', width: 25 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Qty In', key: 'qtyIn', width: 12 },
        { header: 'Qty Out', key: 'qtyOut', width: 12 },
        { header: 'Balance', key: 'balance', width: 14 },
        { header: 'Performed By', key: 'performedBy', width: 22 }
      ];

      rows.forEach(r => {
        worksheet.addRow({
          txNo: r.transactionNumber,
          date: r.createdAt.toISOString().split('T')[0],
          type: r.transactionType,
          material: r.material?.name || '',
          venture: r.venture?.name || '',
          location: r.stockLocation?.name || '',
          qtyIn: Number(r.quantityIn) || 0,
          qtyOut: Number(r.quantityOut) || 0,
          balance: Number(r.balanceAfter) || 0,
          performedBy: r.performedBy?.name || ''
        });
      });
    } else if (module === 'project-report') {
      const and: any[] = [];
      const statusFilter = url.searchParams.get('status');
      if (statusFilter && statusFilter !== 'ALL') and.push({ status: statusFilter });

      const rows = await prisma.venture.findMany({
        where: and.length > 0 ? { AND: and } : undefined,
        include: {
          projectManager: true,
          _count: { select: { assignments: true, documents: true, stocks: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      worksheet.columns = [
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Progress', key: 'progress', width: 15 },
        { header: 'Budget', key: 'budget', width: 20 },
        { header: 'Team Size', key: 'team', width: 15 }
      ];

      rows.forEach(r => {
        worksheet.addRow({
          code: r.code,
          name: r.name,
          status: r.status,
          progress: r.progressPercentage ? `${r.progressPercentage}%` : '0%',
          budget: r.estimatedBudget || 0,
          team: r._count.assignments
        });
      });
    } else if (module === 'employee-report') {
      const scopedWhere = await buildScopedWhere(user, 'employee');
      const and: any[] = [scopedWhere, { status: { not: 'TERMINATED' } }];
      const deptFilter = url.searchParams.get('department');
      if (deptFilter && deptFilter !== 'All' && deptFilter !== 'ALL' && deptFilter !== 'All Departments') {
        and.push({ department: deptFilter });
      }

      const rows = await prisma.employee.findMany({
        where: { AND: and },
        include: { reportingManager: true },
        orderBy: { createdAt: 'desc' }
      });

      worksheet.columns = [
        { header: 'ID', key: 'empId', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Role', key: 'role', width: 20 },
        { header: 'Department', key: 'department', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'Manager', key: 'manager', width: 30 }
      ];

      rows.forEach(r => {
        worksheet.addRow({
          empId: r.employeeId,
          name: `${r.firstName} ${r.lastName}`,
          role: r.designation,
          department: r.department || '',
          email: r.email,
          phone: r.phone,
          manager: r.reportingManager ? `${r.reportingManager.firstName} ${r.reportingManager.lastName}` : ''
        });
      });
    } else if (module === 'inventory-report') {
      const and: any[] = [];
      const catFilter = url.searchParams.get('category');
      if (catFilter && catFilter !== 'All' && catFilter !== 'ALL' && catFilter !== 'All Categories') {
        and.push({ material: { category: { name: { contains: catFilter, mode: 'insensitive' } } } });
      }

      const rows = await prisma.materialStock.findMany({
        where: and.length > 0 ? { AND: and } : undefined,
        include: {
          material: { include: { category: true, unitOfMeasure: true } },
          stockLocation: true,
          venture: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      worksheet.columns = [
        { header: 'Material', key: 'name', width: 30 },
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Venture', key: 'venture', width: 25 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Available Qty', key: 'qty', width: 16 },
        { header: 'Physical Qty', key: 'physicalQty', width: 16 },
        { header: 'UOM', key: 'uom', width: 15 }
      ];

      rows.forEach(r => {
        worksheet.addRow({
          name: r.material.name,
          code: r.material.code,
          category: r.material.category ? r.material.category.name : '',
          venture: r.venture ? r.venture.name : '',
          location: r.stockLocation?.name || '',
          qty: Number(r.availableQuantity) || 0,
          physicalQty: Number(r.physicalQuantity) || 0,
          uom: r.material.unitOfMeasure ? r.material.unitOfMeasure.name : ''
        });
      });
    }

    // Format headers
    worksheet.getRow(1).font = { bold: true };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `naprocs-${module}-${dateStr}`;

    if (format === 'csv') {
      const buffer = await workbook.csv.writeBuffer();
      // Add UTF-8 BOM
      const bom = Buffer.from('\uFEFF', 'utf-8');
      const finalBuffer = Buffer.concat([bom, Buffer.from(buffer)]);
      
      return new NextResponse(finalBuffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    } else {
      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`
        }
      });
    }
  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
