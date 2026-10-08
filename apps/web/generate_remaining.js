const fs = require('fs');
const path = require('path');

const materialsIdDir = path.join(__dirname, 'src/app/api/materials/[id]');
fs.mkdirSync(materialsIdDir, { recursive: true });

const patchMaterialRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const materialId = params.id;
    const body = await parseJsonSafe(req);

    const { hasPermission } = await import('@/lib/permissions');
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'materials:edit')) {
      throw new ApiError(403, 'Forbidden');
    }

    // Explicit allowlist
    const allowed = ['name', 'description', 'categoryId', 'subcategoryId', 'baseUnitId', 'status', 'reorderLevel', 'minimumStockLevel', 'maximumStockLevel'];
    const updateData: any = {};
    for (const key of Object.keys(body)) {
      if (allowed.includes(key)) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) throw new ApiError(400, 'No valid fields provided');

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) throw new ApiError(404, 'Material not found');

    // Subcategory validation
    if (updateData.subcategoryId) {
       const targetCat = updateData.categoryId || material.categoryId;
       const subcat = await prisma.materialSubcategory.findUnique({ where: { id: updateData.subcategoryId } });
       if (!subcat) throw new ApiError(400, 'Subcategory not found');
       if (subcat.categoryId !== targetCat) throw new ApiError(400, 'Subcategory does not belong to selected category');
    }

    // baseUnit block
    if (updateData.baseUnitId && updateData.baseUnitId !== material.baseUnitId) {
       const stockCount = await prisma.materialStock.count({ where: { materialId } });
       const txCount = await prisma.materialTransaction.count({ where: { materialId } });
       if (stockCount > 0 || txCount > 0) {
          throw new ApiError(409, 'Cannot change baseUnit while stock or transactions exist for this material');
       }
    }

    const updated = await prisma.material.update({
       where: { id: materialId },
       data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return handleApiError(e);
  }
}
`;
fs.writeFileSync(path.join(materialsIdDir, 'route.ts'), patchMaterialRoute);

const usersIdDir = path.join(__dirname, 'src/app/api/admin/users/[id]');
fs.mkdirSync(usersIdDir, { recursive: true });

const patchUserRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth();
    if ((actor as any).role !== 'ADMIN') throw new ApiError(403, 'Forbidden');

    const userId = params.id;
    const body = await parseJsonSafe(req);

    const updateData: any = {};
    if (body.employeeId !== undefined) {
        updateData.employeeId = body.employeeId === null ? null : body.employeeId;
    }
    
    if (Object.keys(updateData).length === 0) throw new ApiError(400, 'No valid fields');

    try {
      const updated = await prisma.user.update({
         where: { id: userId },
         data: updateData
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ApiError(409, 'Employee is already linked to another user');
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
`;
fs.writeFileSync(path.join(usersIdDir, 'route.ts'), patchUserRoute);

console.log('Done mapping routes');
