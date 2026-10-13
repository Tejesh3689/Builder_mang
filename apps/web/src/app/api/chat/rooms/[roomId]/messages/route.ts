import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams } from '@/lib/pagination';
import { handleApiError, parseJsonSafe } from '@/lib/api-errors';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { roomId } = resolvedParams;

    // Verify the room actually exists
    const roomExists = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true }
    });
    if (!roomExists) {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    // Verify active user status and room membership in one query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
        chatMembers: userRole !== 'ADMIN' ? { where: { roomId } } : false
      }
    });

    if (!user || !user.isActive || (user.employee && user.employee.status === 'TERMINATED')) {
      return NextResponse.json({ success: false, error: 'User is inactive or terminated' }, { status: 403 });
    }

    // Enforce membership check for GET — non-ADMINs must be a member of the room
    if (userRole !== 'ADMIN' && (!user.chatMembers || user.chatMembers.length === 0)) {
      return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const afterId = searchParams.get('after');
    const order = searchParams.get('order')?.toLowerCase();

    // If 'after' cursor is provided, fetch all messages newer than that cursor
    if (afterId) {
      const cursorMessage = await prisma.chatMessage.findUnique({
        where: { id: afterId },
        select: { createdAt: true }
      });

      if (cursorMessage) {
        const newerMessages = await prisma.chatMessage.findMany({
          where: {
            roomId,
            createdAt: { gt: cursorMessage.createdAt }
          },
          include: {
            sender: {
              select: { id: true, name: true, email: true, role: true }
            },
            reads: true
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
        });
        return NextResponse.json({ success: true, data: newerMessages, pagination: { after: afterId, count: newerMessages.length } });
      }
    }

    const { skip, take } = getPaginationParams(req, 50, 100);

    // Default behavior for live chat: return the latest `take` messages in chronological (asc) order.
    // If order === 'desc', return directly desc.
    let messages;
    if (order === 'desc') {
      messages = await prisma.chatMessage.findMany({
        skip,
        take,
        where: { roomId },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true }
          },
          reads: true
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
      });
    } else {
      // Fetch latest messages (desc), then reverse to ascending so chat displays in natural reading order
      const latestDesc = await prisma.chatMessage.findMany({
        skip,
        take,
        where: { roomId },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true }
          },
          reads: true
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
      });
      messages = latestDesc.reverse();
    }

    const total = await prisma.chatMessage.count({ where: { roomId } });

    return NextResponse.json({ success: true, data: messages, pagination: { skip, take, total } });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const senderId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!senderId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { roomId } = resolvedParams;

    const body = await parseJsonSafe(req);
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Message content is required and cannot be empty' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ success: false, error: 'Message exceeds maximum length of 5000 characters' }, { status: 400 });
    }

    // Verify the room actually exists before writing — prevents phantom messages in non-existent rooms
    const roomExists = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true }
    });
    if (!roomExists) {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    if (userRole !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: senderId },
        include: {
          employee: true,
          chatMembers: { where: { roomId } }
        }
      });

      if (!user || !user.isActive || (user.employee && user.employee.status === 'TERMINATED')) {
        return NextResponse.json({ success: false, error: 'User is inactive or terminated' }, { status: 403 });
      }

      if (!user.chatMembers || user.chatMembers.length === 0) {
        return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content: content.trim()
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    return handleApiError(error);
  }
}
