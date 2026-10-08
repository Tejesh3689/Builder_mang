import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';
import { recordAudit } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: any }) {
  try {
    const user = await requireAuth();
    const attendanceId = params.id;
    const body = await parseJsonSafe(req);

    const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!existing) throw new ApiError(404, 'Attendance record not found');

    if ((user as any).role === 'USER') {
      if (existing.employeeId !== (user as any).employee?.id) throw new ApiError(403, 'Forbidden');
      
      // Users can only checkout
      if (existing.checkOut) throw new ApiError(409, 'Already checked out');
      
      const checkOutTime = new Date();
      const updated = await prisma.attendance.update({
         where: { id: attendanceId },
         data: { checkOut: checkOutTime, markedById: user.id }
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Admins/Managers can correct records
    const { hasPermission } = await import('@/lib/permissions');
    if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'employees:edit')) {
      throw new ApiError(403, 'Forbidden');
    }

    const updateData: any = {};
    if (body.checkIn !== undefined) updateData.checkIn = body.checkIn ? new Date(body.checkIn) : null;
    if (body.checkOut !== undefined) updateData.checkOut = body.checkOut ? new Date(body.checkOut) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.location !== undefined) updateData.location = body.location;
    
    updateData.markedById = user.id;

    const result = await prisma.$transaction(async (tx) => {
       const updated = await tx.attendance.update({
          where: { id: attendanceId },
          data: updateData
       });
       
       await recordAudit(tx, {
          userId: user.id,
          action: 'ATTENDANCE_CORRECTION',
          details: { attendanceId, changes: body }
       });
       return updated;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return handleApiError(e);
  }
}
