import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ventureId = searchParams.get('ventureId');
    const userRole = (session.user as any)?.role || 'USER';
    const userId = (session.user as any)?.id;

    let whereClause: any = {};
    
    if (ventureId) {
      whereClause.ventureId = ventureId;
    }
    
    if (userRole === 'MANAGER' && userId) {
      whereClause.OR = [
        { members: { some: { userId } } },
        { venture: { projectManager: { userId } } }
      ];
    }

    const rooms = await prisma.chatRoom.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, ventureId } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Room name is required' }, { status: 400 });
    }

    const room = await prisma.chatRoom.create({
      data: {
        name,
        ventureId: ventureId || null,
        members: {
          create: [{ userId }]
        }
      }
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    console.error('Failed to create chat room:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
