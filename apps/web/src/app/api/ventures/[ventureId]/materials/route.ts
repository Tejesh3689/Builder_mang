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
    } catch (dbError: any) {
      console.error('Database error in materials GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
