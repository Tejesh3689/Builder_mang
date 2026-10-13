import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    const { roomId } = await params;

    // Verify room exists
    const roomExists = await prisma.chatRoom.findUnique({ where: { id: roomId }, select: { id: true } });
    if (!roomExists) {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    // Must be a member or ADMIN to list members
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'chat:manage')) {
      const isMember = await prisma.chatMember.findUnique({
        where: { roomId_userId: { roomId, userId } }
      });
      if (!isMember) {
        return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 });
      }
    }

    const members = await prisma.chatMember.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return NextResponse.json({ success: true, data: members });
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
    const sessionUserId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    if (!session || !sessionUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN or MANAGER can add members
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'chat:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager required' }, { status: 403 });
    }

    const { roomId } = await params;
    const body = await parseJsonSafe(req);
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Verify the target user actually exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (!targetUser.isActive) {
      return NextResponse.json({ success: false, error: 'Cannot add an inactive user to a room' }, { status: 400 });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, ventureId: true }
    });

    if (!room) {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    // Security: If room belongs to a venture, non-ADMIN must be actively assigned to that venture
    if (room.ventureId && userRole !== 'ADMIN') {
      const callerAssignment = await prisma.employee.findFirst({
        where: {
          userId: sessionUserId,
          assignments: { some: { ventureId: room.ventureId, status: 'ACTIVE' } }
        }
      });

      if (!callerAssignment) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You are not assigned to the venture for this chat room' },
          { status: 403 }
        );
      }
    }

    const member = await prisma.chatMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: {},
      create: { roomId, userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    if (!session || !sessionUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'chat:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager required' }, { status: 403 });
    }

    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId query param is required' }, { status: 400 });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, ventureId: true }
    });

    if (!room) {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    // Security: If room belongs to a venture, non-ADMIN must be actively assigned to that venture
    if (room.ventureId && userRole !== 'ADMIN') {
      const callerAssignment = await prisma.employee.findFirst({
        where: {
          userId: sessionUserId,
          assignments: { some: { ventureId: room.ventureId, status: 'ACTIVE' } }
        }
      });

      if (!callerAssignment) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You are not assigned to the venture for this chat room' },
          { status: 403 }
        );
      }
    }

    // Verify the membership record exists before attempting delete
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });
    if (!membership) {
      return NextResponse.json({ success: false, error: 'User is not a member of this room' }, { status: 404 });
    }

    await prisma.chatMember.delete({
      where: { roomId_userId: { roomId, userId } }
    });

    return NextResponse.json({ success: true, message: 'Member removed' });
  } catch (error: any) {
    return handleApiError(error);
  }
}
