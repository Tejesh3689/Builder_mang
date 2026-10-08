const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app/api/attendance');
fs.mkdirSync(baseDir, { recursive: true });

const listAndCreateRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

// GET: Retrieve attendance with filters
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const dateStr = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If regular user, they can only view their own attendance
    if ((user as any).role === 'USER') {
      if (!user.employeeId) throw new ApiError(403, 'User not linked to an employee');
      if (employeeId && employeeId !== user.employeeId) throw new ApiError(403, 'Forbidden');
    }

    const where: any = {};
    if ((user as any).role === 'USER') {
      where.employeeId = user.employeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (dateStr) {
      const d = new Date(dateStr);
      d.setUTCHours(0,0,0,0);
      where.date = d;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
         const d = new Date(startDate);
         d.setUTCHours(0,0,0,0);
         where.date.gte = d;
      }
      if (endDate) {
         const d = new Date(endDate);
         d.setUTCHours(0,0,0,0);
         where.date.lte = d;
      }
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { employee: true },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST: Check-in
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await parseJsonSafe(req);
    
    // If regular user, force employeeId to theirs
    let targetEmployeeId = body.employeeId;
    if ((user as any).role === 'USER') {
      if (!user.employeeId) throw new ApiError(403, 'User not linked to an employee');
      targetEmployeeId = user.employeeId;
    }

    if (!targetEmployeeId) throw new ApiError(400, 'employeeId is required');

    // Date defaults to today at midnight UTC for uniqueness
    const workingDate = body.date ? new Date(body.date) : new Date();
    workingDate.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const checkInTime = body.checkIn ? new Date(body.checkIn) : now;

    try {
      const attendance = await prisma.attendance.create({
        data: {
          employeeId: targetEmployeeId,
          date: workingDate,
          checkIn: checkInTime,
          status: 'PRESENT',
          location: body.location || null,
          markedById: user.id
        }
      });
      return NextResponse.json({ success: true, data: attendance }, { status: 201 });
    } catch (e: any) {
      if (e.code === 'P2002') {
         throw new ApiError(409, 'Attendance record already exists for this employee on this date');
      }
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
`;
fs.writeFileSync(path.join(baseDir, 'route.ts'), listAndCreateRoute);

const patchDir = path.join(baseDir, '[id]');
fs.mkdirSync(patchDir, { recursive: true });

const patchRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';
import { recordAudit } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const attendanceId = params.id;
    const body = await parseJsonSafe(req);

    const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!existing) throw new ApiError(404, 'Attendance record not found');

    if ((user as any).role === 'USER') {
      if (existing.employeeId !== user.employeeId) throw new ApiError(403, 'Forbidden');
      
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
`;
fs.writeFileSync(path.join(patchDir, 'route.ts'), patchRoute);

console.log('Attendance API endpoints created.');
