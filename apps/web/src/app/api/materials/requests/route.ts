import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    if (!session || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { ventureId, items, priority, requiredDate, remarks } = body;

    if (!ventureId || !items || !items.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Venture Access Check
    if ((session?.user as any)?.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: { include: { assignments: { where: { ventureId, status: 'ACTIVE' } } } } }
      });
      const isAssigned = (user?.employee?.assignments?.length ?? 0) > 0;
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: 'Forbidden: Out of Venture Scope' }, { status: 403 });
      }
    }

    // Generate Request Number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const requestNumber = `REQ-${timestamp}${random}`;

    // Validate quantities strictly
    for (const item of items) {
      const qty = parseFloat(item.requestedQuantity);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid requested quantity: must be greater than zero' }, { status: 400 });
      }
    }

    const newRequest = await prisma.materialRequest.create({
      data: {
        requestNumber,
        ventureId,
        priority: priority || 'NORMAL',
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        remarks,
        status: 'PENDING_APPROVAL',
        createdById: userId,
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            requestedQuantity: parseFloat(item.requestedQuantity)
          }))
        }
      }
    });

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error: any) {
    console.error('Error creating material request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
