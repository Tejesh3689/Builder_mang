import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const meta = searchParams.get('meta');

    if (meta === 'true') {
      const [categories, uoms] = await Promise.all([
        prisma.materialCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.unitOfMeasure.findMany({ orderBy: { name: 'asc' } })
      ]);
      return NextResponse.json({ success: true, categories, uoms });
    }

    const materials = await prisma.material.findMany({
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

    return NextResponse.json({ success: true, data: material });
  } catch (error: any) {
    console.error('Failed to create material:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
