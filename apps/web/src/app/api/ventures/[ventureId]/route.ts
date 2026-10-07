import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { requireAuth, requirePermission, buildScopedWhere } from '@/lib/authorization';
import { ventureUpdateSchema, checkDateOrder, checkCoordinatePair, checkLeaders, validationErrorResponse, dbErrorResponse } from '@/lib/ventureValidation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    try {
      const venture = await prisma.venture.findFirst({
        where: {
          AND: [
            { OR: [{ id: ventureId }, { code: ventureId }] },
            scopedWhere
          ]
        },
        include: {
          projectDirector: { select: { id: true, firstName: true, lastName: true, designation: true } },
          projectManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          siteManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          constructionManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          financeManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          purchaseManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
          assignments: {
            include: {
              employee: true,
            },
          },
          stocks: {
            include: {
              material: {
                include: { category: true, unitOfMeasure: true },
              },
            },
          },
          documents: true,
          announcements: { orderBy: { createdAt: 'desc' } },
          chatRooms: true,
          settings: true,
          requests: { select: { status: true } },
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!venture) {
        return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: venture });
    } catch (dbError) {
      return dbErrorResponse(dbError, 'venture GET');
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    console.error('Unexpected error in venture route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'ventures:edit')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') {
      return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
    }
    const auth_existingVenture = await prisma.venture.findFirst({ where: { AND: [{ OR: [{ id: ventureId }, { code: ventureId }] }, scopedWhere] } });
    if (!auth_existingVenture) return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
    }

    // Allowlisted + type-checked fields only — unknown keys are dropped
    const parsed = ventureUpdateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);
    const { settings, ...fields } = parsed.data;

    // Validate the timeline as it will look after the update, not just the changed fields
    const dateOrderError = checkDateOrder({
      planningStartDate: fields.planningStartDate !== undefined ? fields.planningStartDate : auth_existingVenture.planningStartDate,
      startDate: fields.startDate !== undefined ? fields.startDate : auth_existingVenture.startDate,
      expectedCompletionDate: fields.expectedCompletionDate !== undefined ? fields.expectedCompletionDate : auth_existingVenture.expectedCompletionDate,
    });
    if (dateOrderError) {
      return NextResponse.json({ success: false, error: dateOrderError }, { status: 400 });
    }
    const crossFieldError =
      checkCoordinatePair(
        fields.latitude !== undefined ? fields.latitude : auth_existingVenture.latitude,
        fields.longitude !== undefined ? fields.longitude : auth_existingVenture.longitude
      ) || await checkLeaders(prisma, fields);
    if (crossFieldError) {
      return NextResponse.json({ success: false, error: crossFieldError }, { status: 400 });
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        if (settings) {
          await tx.ventureSetting.upsert({
            where: { ventureId: auth_existingVenture.id },
            create: { ...settings, ventureId: auth_existingVenture.id },
            update: settings,
          });
        }
        return tx.venture.update({
          where: { id: auth_existingVenture.id },
          data: fields satisfies Prisma.VentureUncheckedUpdateInput,
        });
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (dbError) {
      return dbErrorResponse(dbError, 'venture PATCH');
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    console.error('Unexpected error in venture route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'ventures:archive')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or Project Manager access required' }, 
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') {
      return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
    }
    const auth_existingVenture = await prisma.venture.findFirst({ where: { AND: [{ OR: [{ id: ventureId }, { code: ventureId }] }, scopedWhere] } });
    if (!auth_existingVenture) return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });


    // Delete the venture
    await prisma.venture.delete({
      where: { id: auth_existingVenture.id },
    });
    
    // We don't need to create an audit log if the venture is deleted since its relations might cascade delete
    // If we wanted to, we would log it globally without linking the deleted ventureId

    return NextResponse.json({ success: true, message: 'Venture deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete venture:', error);
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    console.error('Unexpected error in venture route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
