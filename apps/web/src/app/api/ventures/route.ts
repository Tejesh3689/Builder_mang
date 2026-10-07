import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams } from '@/lib/pagination';
import { ventureCreateSchema, checkDateOrder, checkCoordinatePair, checkLeaders, validationErrorResponse, dbErrorResponse } from '@/lib/ventureValidation';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const location = searchParams.get('location');

    let whereClause: any = {};

    // Apply strict data scope
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') {
      return NextResponse.json({ success: true, data: [] });
    } else {
      whereClause = { ...whereClause, ...scopedWhere };
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }
    if (location) {
      whereClause.OR = [
        { regCity: { contains: location, mode: 'insensitive' } },
        { siteCity: { contains: location, mode: 'insensitive' } },
      ];
    }
    if (search) {
      const searchOR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { siteCity: { contains: search, mode: 'insensitive' } },
      ];
      if (whereClause.OR) {
        whereClause.AND = [ { OR: whereClause.OR }, { OR: searchOR } ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchOR;
      }
    }

    try {
      const { skip, take } = getPaginationParams(request);
      const ventures = await prisma.venture.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          projectManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          siteManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          _count: { select: { assignments: true, stocks: true, documents: true, requests: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: ventures });
    } catch (dbError) {
      return dbErrorResponse(dbError, 'ventures GET');
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    console.error('Unexpected error in ventures route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'ventures:create')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required to create ventures' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const parsed = ventureCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);
    const data = parsed.data;

    const dateOrderError = checkDateOrder(data);
    if (dateOrderError) {
      return NextResponse.json({ success: false, error: dateOrderError }, { status: 400 });
    }
    const crossFieldError = checkCoordinatePair(data.latitude, data.longitude) || await checkLeaders(prisma, data);
    if (crossFieldError) {
      return NextResponse.json({ success: false, error: crossFieldError }, { status: 400 });
    }
    const { projectDirectorId, projectManagerId, siteManagerId } = data;

    try {
      const creatorUserId = (session?.user as any)?.id;

      const venture = await prisma.$transaction(async (tx) => {
        const newVenture = await tx.venture.create({
          data: {
            ...data,
            estimatedBudget: data.estimatedBudget ?? 0,
            settings: { create: { minStockThresholdDefault: 50, requireMaterialApproval: true } },
            chatRooms: { create: [ { name: 'General Discussion' }, { name: 'Site Engineers & Ops' }, { name: 'Materials & Procurement' } ] },
          },
          include: { chatRooms: { select: { id: true } } },
        });

        // Auto-add venture leaders as chat members in all created rooms
        const leaderEmployeeIds = [projectDirectorId, projectManagerId, siteManagerId].filter((id): id is string => !!id);
        const leaderUsers = leaderEmployeeIds.length > 0
          ? await tx.employee.findMany({ where: { id: { in: leaderEmployeeIds } }, select: { userId: true } })
          : [];
        const memberUserIds = [...new Set([
          ...leaderUsers.map((e) => e.userId).filter(Boolean),
          ...(creatorUserId ? [creatorUserId] : []),
        ])] as string[];

        if (memberUserIds.length > 0) {
          const chatMemberData = newVenture.chatRooms.flatMap((room) =>
            memberUserIds.map((uid) => ({ roomId: room.id, userId: uid }))
          );
          await tx.chatMember.createMany({ data: chatMemberData, skipDuplicates: true });
        }
        
        return newVenture;
      });

      return NextResponse.json({ success: true, data: venture }, { status: 201 });
    } catch (dbError) {
      return dbErrorResponse(dbError, 'ventures POST');
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    console.error('Unexpected error in ventures route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
