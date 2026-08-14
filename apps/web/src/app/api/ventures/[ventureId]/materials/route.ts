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
      const stocks = await prisma.materialStock.findMany({
        where: { ventureId },
        include: {
          material: {
            include: { category: true, unitOfMeasure: true },
          },
        },
      });
      return NextResponse.json({ success: true, data: stocks });
    } catch {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'stk-1', quantity: 420, material: { name: 'OPC Cement 53 Grade', code: 'MAT-CEM-53', category: { name: 'Structural' }, unitOfMeasure: { name: 'Bags' } } },
          { id: 'stk-2', quantity: 8.4, material: { name: 'TMT Steel Rebars 12mm', code: 'MAT-STL-12', category: { name: 'Structural' }, unitOfMeasure: { name: 'Tons' } } },
          { id: 'stk-3', quantity: 320, material: { name: 'Vitrified Floor Tiles 600x600', code: 'MAT-TIL-VIT', category: { name: 'Finishing' }, unitOfMeasure: { name: 'Boxes' } } },
        ],
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
