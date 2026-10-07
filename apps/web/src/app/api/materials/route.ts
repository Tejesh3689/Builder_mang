import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams } from '@/lib/pagination';

const ALLOWED_ROLES = ['ADMIN', 'MANAGER', 'SUPERVISOR'];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const meta = searchParams.get('meta');

    if (meta === 'true') {
      const [categories, uoms] = await Promise.all([
        prisma.materialCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.unitOfMeasure.findMany({ orderBy: { name: 'asc' } })
      ]);
      return NextResponse.json({ success: true, categories, uoms });
    }

    const { skip, take } = getPaginationParams(req);
    const materials = await prisma.material.findMany({
      skip,
      take,
      include: {
        category: true,
        unitOfMeasure: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: materials });
  } catch (error: any) {
    console.error('Failed to fetch materials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'ADMIN' && !hasPermission(userRole, 'materials:create'))) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, categoryName, uomName, reorderLevel } = body;

    if (!name || !code || !categoryName || !uomName) {
      return NextResponse.json(
        { success: false, error: 'Name, code, category name, and unit of measure name are required.' },
        { status: 400 }
      );
    }

    // 1. Resolve or create Category
    let category = await prisma.materialCategory.findFirst({
      where: { name: { equals: categoryName, mode: 'insensitive' } }
    });
    if (!category) {
      category = await prisma.materialCategory.create({
        data: { name: categoryName }
      });
    }

    // 2. Resolve or create Unit of Measure (UOM)
    let uom = await prisma.unitOfMeasure.findFirst({
      where: { name: { equals: uomName, mode: 'insensitive' } }
    });
    if (!uom) {
      uom = await prisma.unitOfMeasure.create({
        data: { name: uomName }
      });
    }

    // 3. Create the Material
    const material = await prisma.material.create({
      data: {
        name,
        code,
        categoryId: category.id,
        baseUnitId: uom.id,
        reorderLevel: reorderLevel ? parseFloat(reorderLevel) : 0,
        status: 'ACTIVE'
      },
      include: {
        category: true,
        unitOfMeasure: true
      }
    });

    return NextResponse.json({ success: true, data: material }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create material:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
