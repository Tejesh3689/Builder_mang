import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams } from '@/lib/pagination';
import { handleApiError, parseJsonSafe } from '@/lib/api-errors';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const { skip, take } = getPaginationParams(req);

    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where: whereClause }),
      // Always return total unread count regardless of the `unread` filter
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: { skip, take, total },
      unreadCount
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Only ADMIN can dispatch arbitrary notifications directly to users
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required to send notifications' }, { status: 403 });
    }

    const body = await parseJsonSafe(req);
    const { title, body: content, targetUserId } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Body is required' }, { status: 400 });
    }
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });
    }

    // Verify target user actually exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
    }

    const notification = await prisma.notification.create({
      data: {
        title: title.trim(),
        body: content.trim(),
        userId: targetUserId
      }
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    return handleApiError(error);
  }
}
