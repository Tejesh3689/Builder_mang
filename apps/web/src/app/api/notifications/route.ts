import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams } from '@/lib/pagination';

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

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, body: content, targetUserId } = body;

    if (!title || !content || !targetUserId) {
      return NextResponse.json({ success: false, error: 'Title, body, and targetUserId are required' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        body: content,
        userId: targetUserId
      }
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
