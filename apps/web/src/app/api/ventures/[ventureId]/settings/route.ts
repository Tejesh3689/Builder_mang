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
      const setting = await prisma.ventureSetting.findUnique({
        where: { ventureId },
      });
      return NextResponse.json({ success: true, data: setting });
    } catch (dbError: any) {
      console.error('Database error in settings GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
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
      const updated = await prisma.ventureSetting.upsert({
        where: { ventureId },
        update: body,
        create: { ventureId, ...body },
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (dbError: any) {
      console.error('Database error in settings PATCH:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
