import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { notificationId } = resolvedParams;
    const body = await req.json();
    const { isRead } = body;

    const existing = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    if (existing.userId !== userId && (session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: typeof isRead === 'boolean' ? isRead : undefined }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { notificationId } = resolvedParams;

    const existing = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    if (existing.userId !== userId && (session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
