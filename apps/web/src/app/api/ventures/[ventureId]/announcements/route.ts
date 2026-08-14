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
      const announcements = await prisma.ventureAnnouncement.findMany({
        where: { ventureId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: announcements });
    } catch {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'ann-1', title: 'Safety Audit & Crane Inspection Scheduled', message: 'Third-party heavy machinery inspection on Friday 9:00 AM.', priority: 'HIGH', createdAt: new Date().toISOString() },
          { id: 'ann-2', title: 'TMT Steel Bulk Dispatch Arriving Tomorrow', message: 'Logistics team to prepare bay 3 for offloading.', priority: 'NORMAL', createdAt: new Date().toISOString() },
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
    const { title, message, priority = 'NORMAL', audience = 'ALL' } = await request.json();

    try {
      const created = await prisma.ventureAnnouncement.create({
        data: {
          ventureId,
          title,
          message,
          priority,
          audience,
        },
      });
      return NextResponse.json({ success: true, data: created });
    } catch {
      return NextResponse.json({
        success: true,
        data: { id: `ann-${Date.now()}`, ventureId, title, message, priority, audience, createdAt: new Date().toISOString() },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
