import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams } from '@/lib/pagination';

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

    // Verify active user status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true }
    });

    if (!user || !user.isActive || (user.employee && user.employee.status === 'TERMINATED')) {
      return NextResponse.json({ success: false, error: 'User is inactive or terminated' }, { status: 403 });
    }

    // Enforce membership check for GET — non-ADMINs must be a member of the room
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'chat:manage')) {
      const isMember = await prisma.chatMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
        include: { room: true }
      });
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 });
      }

      // Explicit membership in the room is sufficient, no need to check venture assignment
    }

    const { skip, take } = getPaginationParams(req);
    const messages = await prisma.chatMessage.findMany({
      skip,
      take,
      where: { roomId },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('Failed to fetch chat messages:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { roomId } = resolvedParams;

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const senderId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!senderId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'chat:manage')) {
      const user = await prisma.user.findUnique({
        where: { id: senderId },
        include: { employee: true }
      });

      if (!user || !user.isActive || (user.employee && user.employee.status === 'TERMINATED')) {
        return NextResponse.json({ success: false, error: 'User is inactive or terminated' }, { status: 403 });
      }

      const isMember = await prisma.chatMember.findUnique({
        where: { roomId_userId: { roomId, userId: senderId } },
        include: { room: true }
      });
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 });
      }

      // Explicit membership in the room is sufficient, no need to check venture assignment
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error('Failed to send chat message:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
