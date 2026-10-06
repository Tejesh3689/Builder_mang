import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
      const ventures = await prisma.venture.findMany({
        where: whereClause,
        include: {
          projectManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          siteManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          _count: { select: { assignments: true, stocks: true, documents: true, requests: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: ventures });
    } catch (dbError: any) {
      console.error('Database error in ventures GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required to create ventures' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, code, type = 'RESIDENTIAL', description, status = 'ACTIVE',
      regAddressLine1, regCity, regState, regPincode,
      siteAddressLine1, siteCity, siteState, sitePincode,
      latitude, longitude, startDate, expectedCompletionDate, estimatedBudget,
      projectDirectorId, projectManagerId, siteManagerId,
    } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Venture name and unique code are required' }, { status: 400 });
    }

    try {
      const creatorUserId = (session?.user as any)?.id;

      const venture = await prisma.$transaction(async (tx) => {
        const newVenture = await tx.venture.create({
          data: {
            name, code, type, description, status,
            regAddressLine1, regCity, regState, regPincode,
            siteAddressLine1, siteCity, siteState, sitePincode,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            startDate: startDate ? new Date(startDate) : null,
            expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
            estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : 0,
            projectDirectorId: projectDirectorId || null,
            projectManagerId: projectManagerId || null,
            siteManagerId: siteManagerId || null,
            settings: { create: { minStockThresholdDefault: 50, requireMaterialApproval: true } },
            chatRooms: { create: [ { name: 'General Discussion' }, { name: 'Site Engineers & Ops' }, { name: 'Materials & Procurement' } ] },
          },
          include: { chatRooms: { select: { id: true } } },
        });

        // Auto-add venture leaders as chat members in all created rooms
        const leaderEmployeeIds = [projectDirectorId, projectManagerId, siteManagerId].filter(Boolean);
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
    } catch (dbError: any) {
      console.error('Database error in ventures POST:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
