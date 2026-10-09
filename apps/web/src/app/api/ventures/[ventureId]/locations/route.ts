import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    await requireAuth();
    const { ventureId } = await params;
    const locations = await prisma.stockLocation.findMany({
      where: { ventureId },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, data: locations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const { ventureId } = await params;
    
    let body;
    try {
      body = await req.json();
    } catch(e) {
      return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
    }
    const { code, name, type, address } = body;
    
    if (!code || !name || !type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = ['MAIN_STORE', 'SITE_STORE', 'WAREHOUSE', 'TOWER_STORE', 'OTHER'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid location type' }, { status: 400 });
    }

    const location = await prisma.stockLocation.create({
      data: {
        ventureId,
        code: code.trim(),
        name: name.trim(),
        type: type.trim(),
        address: address ? address.trim() : null
      }
    });

    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Stock location code must be unique within venture' }, { status: 409 });
    }
    console.error('Failed to create location:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
