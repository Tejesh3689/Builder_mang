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
    const certifications = await prisma.employeeCertification.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: certifications });
  } catch (error: any) {
    console.error('Failed to fetch certifications:', error);
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
    const { certification, certificateNo, issueDate, expiryDate, authority } = body;

    if (!certification || !certificateNo || !expiryDate) {
      return NextResponse.json(
        { success: false, error: 'Certification name, certificate number, and expiry date are required.' },
        { status: 400 }
      );
    }

    const expiry = new Date(expiryDate);
    const today = new Date();
    const warningDays = 30 * 24 * 60 * 60 * 1000;
    const diff = expiry.getTime() - today.getTime();

    let certStatus = 'Valid';
    if (diff < 0) {
      certStatus = 'Expired';
    } else if (diff < warningDays) {
      certStatus = 'Expiring Soon';
    }

    const newCert = await prisma.employeeCertification.create({
      data: {
        employeeId: id,
        certification,
        certificateNo,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiry,
        status: certStatus,
        authority: authority || 'National Safety Agency',
      },
    });

    return NextResponse.json({ success: true, data: newCert });
  } catch (error: any) {
    console.error('Failed to add certification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
