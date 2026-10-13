import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError } from '@/lib/api-errors';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { messageId } = resolvedParams;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, roomId: true }
    });

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Check if user is a member of the room (unless ADMIN)
    if (userRole !== 'ADMIN') {
      const isMember = await prisma.chatMember.findUnique({
        where: { roomId_userId: { roomId: message.roomId, userId } }
      });

      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 });
      }
    }

    // Idempotent upsert — re-marking an already-read message is a no-op that succeeds
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
    return handleApiError(error);
  }
}
