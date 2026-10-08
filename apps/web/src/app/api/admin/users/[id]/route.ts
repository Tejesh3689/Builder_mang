import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

export async function PATCH(req: Request, { params }: { params: any }) {
  try {
    const actor = await requireAuth();
    if ((actor as any).role !== 'ADMIN') throw new ApiError(403, 'Forbidden');

    const userId = params.id;
    const body = await parseJsonSafe(req);

    const updateData: any = {};
    if (body.employeeId !== undefined) {
        updateData.employeeId = body.employeeId === null ? null : body.employeeId;
    }
    
    if (Object.keys(updateData).length === 0) throw new ApiError(400, 'No valid fields');

    try {
      const updated = await prisma.user.update({
         where: { id: userId },
         data: updateData
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ApiError(409, 'Employee is already linked to another user');
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
