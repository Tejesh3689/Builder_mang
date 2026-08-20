import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { certification, certificateNo, issueDate, expiryDate, status, authority } = body;

    const expiry = expiryDate ? new Date(expiryDate) : undefined;
    let certStatus = status;

    if (expiry) {
      const today = new Date();
      const warningDays = 30 * 24 * 60 * 60 * 1000;
      const diff = expiry.getTime() - today.getTime();

      if (diff < 0) {
        certStatus = 'Expired';
      } else if (diff < warningDays) {
        certStatus = 'Expiring Soon';
      } else {
        certStatus = 'Valid';
      }
    }

    const updated = await prisma.employeeCertification.update({
      where: { id },
      data: {
        certification,
        certificateNo,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiry,
        status: certStatus,
        authority,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update certification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.employeeCertification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: 'Certification deleted successfully.' } });
  } catch (error: any) {
    console.error('Failed to delete certification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
