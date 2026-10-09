import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
