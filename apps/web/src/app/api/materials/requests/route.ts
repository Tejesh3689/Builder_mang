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

    // Generate Request Number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const requestNumber = `REQ-${timestamp}${random}`;

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
