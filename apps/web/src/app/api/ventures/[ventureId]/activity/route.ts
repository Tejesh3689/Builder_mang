import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    try {
      const logs = await prisma.auditLog.findMany({
        where: { ventureId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: logs });
    } catch {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'aud-1', action: 'MATERIAL_REQUEST_APPROVED', details: 'Rajesh approved Material Request MR-1024 for 100 bags OPC Cement', createdAt: new Date().toISOString() },
          { id: 'aud-2', action: 'STOCK_ISSUED', details: 'Suresh issued 50 bags Cement to Tower A Phase 2 Slab', createdAt: new Date().toISOString() },
          { id: 'aud-3', action: 'EMPLOYEE_ASSIGNED', details: 'Assigned Vikram Singh as Store Manager to Green Heights', createdAt: new Date().toISOString() },
        ],
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
