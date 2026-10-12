import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { getCompanySettings, updateCompanySettings } from '@/services/settings.service';
import { companySettingsPatchSchema } from '@/lib/validation/companySettings';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const settings = await getCompanySettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    const status = error.statusCode || error.status || 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const parsed = companySettingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e: any) => {
        const field = e.path.join('.');
        fieldErrors[field] = e.message;
      });
      return NextResponse.json(
        { success: false, error: 'Validation failed', fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateCompanySettings(user.id, parsed.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.statusCode === 409 || error.code === 'VERSION_CONFLICT') {
      return NextResponse.json(
        { success: false, error: 'Settings were changed by someone else. Reload.', code: 'VERSION_CONFLICT' },
        { status: 409 }
      );
    }
    const status = error.statusCode || error.status || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to update settings' }, { status });
  }
}
