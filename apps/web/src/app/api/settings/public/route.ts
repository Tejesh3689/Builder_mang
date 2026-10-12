import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { getPublicCompanySettings } from '@/services/settings.service';

export async function GET() {
  try {
    await requireAuth();
    const publicSettings = await getPublicCompanySettings();
    return NextResponse.json({ success: true, data: publicSettings });
  } catch (error: any) {
    const status = error.statusCode || error.status || 401;
    return NextResponse.json({ success: false, error: error.message || 'Unauthorized' }, { status });
  }
}
