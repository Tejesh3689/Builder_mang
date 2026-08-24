import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error('Failed to fetch employee documents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or Project Manager access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, fileUrl, fileType } = body;

    if (!name || !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Document name and file URL are required.' },
        { status: 400 }
      );
    }

    const newDoc = await prisma.employeeDocument.create({
      data: {
        employeeId: id,
        name,
        fileUrl,
        fileType: fileType || 'PDF',
      },
    });

    return NextResponse.json({ success: true, data: newDoc });
  } catch (error: any) {
    console.error('Failed to add employee document:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
