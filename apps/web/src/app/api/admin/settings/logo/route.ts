import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';

function checkMagicBytes(buffer: Uint8Array): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export async function GET() {
  try {
    const logo = await (prisma as any).companyLogo.findUnique({
      where: { id: 'default' },
    });

    if (!logo || !logo.data) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(Buffer.from(logo.data), {
      status: 200,
      headers: {
        'Content-Type': logo.mimeType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch logo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'A file must be uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Max 512 KB
    if (bytes.byteLength > 512 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum limit of 512 KB' },
        { status: 400 }
      );
    }

    const detectedMime = checkMagicBytes(bytes);
    if (!detectedMime) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only PNG, JPG, and WEBP are supported (SVG is not allowed).' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await (tx as any).companyLogo.upsert({
        where: { id: 'default' },
        update: {
          mimeType: detectedMime,
          data: Buffer.from(bytes),
        },
        create: {
          id: 'default',
          mimeType: detectedMime,
          data: Buffer.from(bytes),
        },
      });

      await recordAudit(tx, {
        userId: user.id,
        action: 'UPLOAD_COMPANY_LOGO',
        details: { mimeType: detectedMime, sizeBytes: bytes.byteLength },
      });
    });

    const logoUrl = `/api/admin/settings/logo?v=${Date.now()}`;
    return NextResponse.json({ success: true, logoUrl });
  } catch (error: any) {
    const status = error.statusCode || error.status || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to upload logo' }, { status });
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await (tx as any).companyLogo.deleteMany({
        where: { id: 'default' },
      });

      await recordAudit(tx, {
        userId: user.id,
        action: 'DELETE_COMPANY_LOGO',
        details: {},
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.statusCode || error.status || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete logo' }, { status });
  }
}
