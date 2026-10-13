import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError, parseJsonSafe } from '@/lib/api-errors';

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

    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    // Users can only update their own notifications
    if (existing.userId !== userId && (session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseJsonSafe(req);
    const { isRead } = body;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isRead must be a boolean' }, { status: 400 });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return handleApiError(error);
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
      where: { id: notificationId },
      select: { id: true, userId: true }
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
    return handleApiError(error);
  }
}
