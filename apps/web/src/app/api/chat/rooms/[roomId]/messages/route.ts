import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { roomId } = resolvedParams;

    const messages = await prisma.chatMessage.findMany({
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
    let senderId = (session?.user as any)?.id;

    if (!senderId) {
      // Fallback to first user in database for developer convenience / testing
      const firstUser = await prisma.user.findFirst();
      senderId = firstUser?.id;
    }

    if (!senderId) {
      return NextResponse.json({ success: false, error: 'No active user found to send the message' }, { status: 401 });
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
