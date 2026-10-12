import { NextResponse } from 'next/server';
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
      if (!(user as any).employee?.id) throw new ApiError(403, 'User not linked to an employee');
      if (employeeId && employeeId !== user.employee!.id) throw new ApiError(403, 'Forbidden');
    }

    const where: any = {};
    if ((user as any).role === 'USER') {
      where.employeeId = user.employee!.id;
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
      if (!(user as any).employee?.id) throw new ApiError(403, 'User not linked to an employee');
      targetEmployeeId = user.employee!.id;
    }

    if (!targetEmployeeId) throw new ApiError(400, 'employeeId is required');

    // Date defaults to today at midnight UTC for uniqueness
    const workingDate = body.date ? new Date(body.date) : new Date();
    workingDate.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const checkInTime = body.checkIn ? new Date(body.checkIn) : now;

    // Read company settings for workforce shift rules
    const { getCompanySettings } = await import('@/services/settings.service');
    const settings = await getCompanySettings();

    // Evaluate check-in time against shiftStart + lateGraceMinutes in company timezone
    let computedStatus = 'PRESENT';
    if (settings.shiftStart) {
      const [shiftH, shiftM] = settings.shiftStart.split(':').map(Number);
      const graceMinutes = settings.lateGraceMinutes ?? 15;
      
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone || 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(checkInTime);
      
      const localH = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
      const localM = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
      const checkInMinutes = localH * 60 + localM;
      const shiftDeadlineMinutes = shiftH * 60 + shiftM + graceMinutes;
      
      if (checkInMinutes > shiftDeadlineMinutes) {
        computedStatus = 'LATE';
      }
    }

    try {
      const attendance = await prisma.attendance.create({
        data: {
          employeeId: targetEmployeeId,
          date: workingDate,
          checkIn: checkInTime,
          status: (body.status || computedStatus) as any,
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
