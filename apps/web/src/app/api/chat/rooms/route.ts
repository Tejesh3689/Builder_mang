import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ventureId = searchParams.get('ventureId');

    const rooms = await prisma.chatRoom.findMany({
      where: ventureId ? { ventureId } : undefined,
      include: {
        venture: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { messages: true, members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: rooms });
  } catch (error: any) {
    console.error('Failed to fetch chat rooms:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ventureId } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Room name is required' }, { status: 400 });
    }

    const room = await prisma.chatRoom.create({
      data: {
        name,
        ventureId: ventureId || null
      }
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    console.error('Failed to create chat room:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
