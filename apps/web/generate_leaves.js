const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app/api/leaves');
fs.mkdirSync(baseDir, { recursive: true });

const listAndCreateRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

// Helper to calculate days (simplified, ideally excludes weekends/holidays)
const calculateDays = (start: Date, end: Date) => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// GET: Retrieve leave requests
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

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
    if (status) where.status = status;

    const records = await prisma.leaveRequest.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST: Apply for leave
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await parseJsonSafe(req);
    
    let targetEmployeeId = body.employeeId;
    if ((user as any).role === 'USER') {
      if (!user.employeeId) throw new ApiError(403, 'User not linked to an employee');
      targetEmployeeId = user.employeeId;
    }

    if (!targetEmployeeId || !body.type || !body.startDate || !body.endDate) {
      throw new ApiError(400, 'Missing required fields');
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    startDate.setUTCHours(0,0,0,0);
    endDate.setUTCHours(0,0,0,0);

    if (endDate < startDate) throw new ApiError(400, 'End date cannot be before start date');
    const daysRequested = calculateDays(startDate, endDate);

    const employee = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });
    if (!employee) throw new ApiError(404, 'Employee not found');
    if (employee.status === 'TERMINATED') throw new ApiError(409, 'Employee is terminated');

    // Check balance if needed (can also wait until approval, but good to check early)
    let balance = 0;
    if (body.type === 'PAID') balance = employee.leaveBalancePaid || 0;
    else if (body.type === 'SICK') balance = employee.leaveBalanceSick || 0;
    else if (body.type === 'CASUAL') balance = employee.leaveBalanceCasual || 0;
    
    if (balance < daysRequested) throw new ApiError(409, \`Insufficient \${body.type} leave balance\`);

    // Check overlaps
    const overlaps = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: targetEmployeeId,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } }
        ]
      }
    });

    if (overlaps) throw new ApiError(409, 'Leave request overlaps with an existing active request');

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: targetEmployeeId,
        type: body.type,
        startDate,
        endDate,
        reason: body.reason,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
`;
fs.writeFileSync(path.join(baseDir, 'route.ts'), listAndCreateRoute);

const processDir = path.join(baseDir, '[id]/process');
fs.mkdirSync(processDir, { recursive: true });

const processRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';
import { recordAudit } from '@/lib/audit';

const calculateDays = (start: Date, end: Date) => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const requestId = params.id;
    const body = await parseJsonSafe(req);
    const { action } = body; // APPROVE, REJECT, CANCEL

    if (!['APPROVE', 'REJECT', 'CANCEL'].includes(action)) throw new ApiError(400, 'Invalid action');

    const existing = await prisma.leaveRequest.findUnique({ where: { id: requestId }, include: { employee: true } });
    if (!existing) throw new ApiError(404, 'Leave request not found');

    if (action === 'CANCEL') {
      if ((user as any).role === 'USER' && existing.employeeId !== user.employeeId) {
        throw new ApiError(403, 'Forbidden');
      }
      if (existing.status === 'CANCELLED' || existing.status === 'REJECTED') {
         throw new ApiError(409, 'Cannot cancel already finalized request');
      }
    } else {
      const { hasPermission } = await import('@/lib/permissions');
      if ((user as any).role !== 'ADMIN' && !hasPermission((user as any).role, 'employees:edit')) {
        throw new ApiError(403, 'Forbidden');
      }
      if (existing.status !== 'PENDING') throw new ApiError(409, 'Only PENDING requests can be processed');
    }

    const days = calculateDays(existing.startDate, existing.endDate);

    const result = await prisma.$transaction(async (tx) => {
       const nextStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'CANCELLED');
       
       const updated = await tx.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: nextStatus,
            approvedById: action === 'APPROVE' || action === 'REJECT' ? user.id : undefined,
            approvedAt: action === 'APPROVE' || action === 'REJECT' ? new Date() : undefined,
          }
       });

       // Deduct balance on APPROVE
       if (action === 'APPROVE') {
          let balanceField = '';
          if (existing.type === 'PAID') balanceField = 'leaveBalancePaid';
          else if (existing.type === 'SICK') balanceField = 'leaveBalanceSick';
          else if (existing.type === 'CASUAL') balanceField = 'leaveBalanceCasual';
          
          if (balanceField) {
             const current = await tx.employee.findUnique({ where: { id: existing.employeeId } });
             if ((current as any)[balanceField] < days) {
                throw new ApiError(409, 'Insufficient balance for approval');
             }
             await tx.employee.update({
                where: { id: existing.employeeId },
                data: { [balanceField]: { decrement: days } }
             });
          }
       } else if (action === 'CANCEL' && existing.status === 'APPROVED') {
          // Restore balance if cancelled after approval
          let balanceField = '';
          if (existing.type === 'PAID') balanceField = 'leaveBalancePaid';
          else if (existing.type === 'SICK') balanceField = 'leaveBalanceSick';
          else if (existing.type === 'CASUAL') balanceField = 'leaveBalanceCasual';
          
          if (balanceField) {
             await tx.employee.update({
                where: { id: existing.employeeId },
                data: { [balanceField]: { increment: days } }
             });
          }
       }

       await recordAudit(tx, {
          userId: user.id,
          action: \`LEAVE_REQUEST_\${action}\`,
          details: { requestId, employeeId: existing.employeeId, days, type: existing.type }
       });

       return updated;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return handleApiError(e);
  }
}
`;
fs.writeFileSync(path.join(processDir, 'route.ts'), processRoute);

// Balance retrieval route
const balanceDir = path.join(baseDir, 'balance');
fs.mkdirSync(balanceDir, { recursive: true });

const balanceRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError } from '@/lib/api-errors';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    let targetEmployeeId = employeeId;
    if ((user as any).role === 'USER') {
      if (!user.employeeId) throw new ApiError(403, 'User not linked to an employee');
      if (employeeId && employeeId !== user.employeeId) throw new ApiError(403, 'Forbidden');
      targetEmployeeId = user.employeeId;
    }

    if (!targetEmployeeId) throw new ApiError(400, 'employeeId is required');

    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { leaveBalancePaid: true, leaveBalanceSick: true, leaveBalanceCasual: true }
    });

    if (!employee) throw new ApiError(404, 'Employee not found');

    return NextResponse.json({ success: true, data: employee });
  } catch (e) {
    return handleApiError(e);
  }
}
`;
fs.writeFileSync(path.join(balanceDir, 'route.ts'), balanceRoute);

console.log('Leave Management API endpoints created.');
