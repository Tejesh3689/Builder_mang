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
      const documents = await prisma.ventureDocument.findMany({
        where: { ventureId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: documents });
    } catch (dbError: any) {
      console.error('Database error in documents GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;
    const { title, category = 'OTHER', fileUrl = '/docs/sample.pdf', version = '1.0' } = await request.json();

    try {
      const created = await prisma.ventureDocument.create({
        data: {
          ventureId,
          title,
          category,
          fileUrl,
          fileType: 'application/pdf',
          fileSize: 1024000,
          version,
        },
      });
      return NextResponse.json({ success: true, data: created });
    } catch (dbError: any) {
      console.error('Database error in documents POST:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
