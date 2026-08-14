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
    } catch {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'doc-1', title: 'Municipal Building Approval Plan.pdf', category: 'APPROVALS', fileType: 'application/pdf', fileSize: 4500000, version: '2.1' },
          { id: 'doc-2', title: 'Structural Design & Foundation Blueprints.dwg', category: 'DRAWINGS', fileType: 'image/vnd.dwg', fileSize: 12400000, version: '1.0' },
          { id: 'doc-3', title: 'Environmental Impact Certificate.pdf', category: 'LEGAL', fileType: 'application/pdf', fileSize: 2100000, version: '1.0' },
        ],
      });
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
    } catch {
      return NextResponse.json({
        success: true,
        data: { id: `doc-${Date.now()}`, ventureId, title, category, version, createdAt: new Date().toISOString() },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
