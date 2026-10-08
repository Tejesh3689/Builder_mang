import { prisma } from '@/lib/db';
import { requireAuth, buildScopedWhere } from '@/lib/authorization';
import { Prisma } from '@prisma/client';

/**
 * Reusable, RBAC-scoped reporting service.
 * Enforces venture isolation and decimal-safe inventory calculations natively.
 */

export async function getInventoryReport(filters: { categoryId?: string; search?: string; status?: string } = {}) {
  const user = await requireAuth();
  const scopedWhere = await buildScopedWhere(user, 'venture');
  
  // If the user has DENY_ALL, return empty immediately.
  if (scopedWhere.id === 'DENY_ALL') return [];

  // Material filters
  const materialWhere: any = {};
  if (filters.categoryId) materialWhere.categoryId = filters.categoryId;
  if (filters.search) materialWhere.name = { contains: filters.search, mode: 'insensitive' };

  // For stock, we only count stock locations belonging to ventures the user can see.
  const materials = await prisma.material.findMany({
    where: materialWhere,
    include: {
      category: true,
      stocks: {
        where: scopedWhere.id ? undefined : { venture: scopedWhere } // If ADMIN, no restriction. If scoped, apply restriction.
      },
    },
    orderBy: { name: 'asc' }
  });

  return materials.map(mat => {
    // Decimal-safe reduction for inventory totals
    let totalStock = new Prisma.Decimal(0);
    for (const stock of mat.stocks) {
       totalStock = totalStock.add(stock.physicalQuantity as any);
    }
    
    const reorder = new Prisma.Decimal(mat.reorderLevel as any);
    
    let status = 'In Stock';
    if (totalStock.lte(0)) status = 'Out of Stock';
    else if (totalStock.lte(reorder)) status = 'Low Stock';

    if (filters.status && filters.status !== 'All' && status !== filters.status) return null;

    return {
      id: mat.code || mat.id,
      item: mat.name,
      category: mat.category?.name || 'Uncategorized',
      stock: totalStock.toNumber(),
      reorder: reorder.toNumber(),
      status
    };
  }).filter(Boolean);
}

export async function getWorkforceReport(filters: { projectId?: string; department?: string } = {}) {
  const user = await requireAuth();
  
  // Enforce employee read scope
  const { hasPermission } = await import('@/lib/permissions');
  if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'employees:view')) {
     throw new Error('Forbidden');
  }

  const where: any = {};
  if (filters.department && filters.department !== 'All') where.department = filters.department;

  const employees = await prisma.employee.findMany({
    where,
    include: {
      assignments: {
        where: { status: 'ACTIVE' },
        include: { venture: true }
      },
      reportingManager: true,
      certifications: true
    },
    orderBy: { firstName: 'asc' }
  });

  return employees.map(item => {
    const activeAssignment = item.assignments?.[0];
    
    if (filters.projectId && filters.projectId !== 'All' && activeAssignment?.ventureId !== filters.projectId) {
       return null;
    }

    return {
      id: item.id,
      employeeId: item.employeeId,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email || '',
      designation: item.designation,
      department: item.department,
      status: item.status === 'ACTIVE' ? 'Active' : item.status === 'ON_LEAVE' ? 'On Leave' : 'Terminated',
      joiningDate: item.joiningDate || '',
      currentProject: activeAssignment?.venture?.name || 'Unassigned',
      currentSite: activeAssignment?.roleAtSite || '—',
      reportingManager: item.reportingManager ? `${item.reportingManager.firstName} ${item.reportingManager.lastName}` : '—',
      certifications: item.certifications || []
    };
  }).filter(Boolean);
}
