import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams } from '@/lib/pagination';
import { handleApiError, parseJsonSafe } from '@/lib/api-errors';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role || 'USER';
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ventureId = searchParams.get('ventureId');

    let whereClause: any = {};

    if (ventureId) {
      whereClause.ventureId = ventureId;
    }

    if (userRole === 'MANAGER') {
      whereClause.OR = [
        { members: { some: { userId } } },
        { venture: { projectManager: { userId } } }
      ];
    } else if (userRole !== 'ADMIN' && !hasPermission(userRole, 'chat:manage')) {
      // Other non-admin roles only see rooms they are a member of.
      whereClause.members = { some: { userId } };
    }

    const finalWhere = Object.keys(whereClause).length > 0 ? whereClause : undefined;

    const { skip, take } = getPaginationParams(req);

    const [rooms, total] = await Promise.all([
      prisma.chatRoom.findMany({
        skip,
        take,
        where: finalWhere,
        include: {
          venture: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { messages: true, members: true }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              sender: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.chatRoom.count({ where: finalWhere })
    ]);

    // Reshape: hoist messages[0] to lastMessage
    const data = rooms.map(({ messages, ...room }) => ({
      ...room,
      lastMessage: messages[0] ?? null
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { skip, take, total }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseJsonSafe(req);
    const { name, ventureId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Room name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // If scoped to a venture, verify the venture exists and the creating user is assigned (unless ADMIN)
    if (ventureId) {
      const venture = await prisma.venture.findUnique({ where: { id: ventureId }, select: { id: true } });
      if (!venture) {
        return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
      }

      if (userRole !== 'ADMIN' && !hasPermission(userRole, 'chat:manage')) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            employee: {
              include: { assignments: { where: { ventureId, status: 'ACTIVE' } } }
            }
          }
        });
        const isAssigned = (user?.employee?.assignments?.length ?? 0) > 0;
        if (!isAssigned) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You are not assigned to this venture' },
            { status: 403 }
          );
        }
      }
    }

    const room = await prisma.chatRoom.create({
      data: {
        name: trimmedName,
        ventureId: ventureId || null,
        members: {
          create: [{ userId }]
        }
      }
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
