import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { messageId } = resolvedParams;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { room: true }
    });

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Check if user is a member of the room
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { chatMembers: { where: { roomId: message.roomId } } }
    });

    if ((session?.user as any)?.role !== 'ADMIN' && (!user?.chatMembers || user.chatMembers.length === 0)) {
      return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 });
    }

    // Using nested upsert because there is a unique constraint on [messageId, userId]
    const read = await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        messageId,
        userId
      }
    });

    return NextResponse.json({ success: true, data: read });
  } catch (error: any) {
    console.error('Failed to mark message as read:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
