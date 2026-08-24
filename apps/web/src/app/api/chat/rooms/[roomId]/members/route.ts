import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Must be a member or ADMIN to list members
    if (userRole !== 'ADMIN') {
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
    console.error('Failed to fetch chat members:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    // Only ADMIN or PROJECT_MANAGER can add members
    if (userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager required' }, { status: 403 });
    }

    const { roomId } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
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
    console.error('Failed to add chat member:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    if (userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager required' }, { status: 403 });
    }

    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId query param is required' }, { status: 400 });
    }

    await prisma.chatMember.delete({
      where: { roomId_userId: { roomId, userId } }
    });

    return NextResponse.json({ success: true, message: 'Member removed' });
  } catch (error: any) {
    console.error('Failed to remove chat member:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
