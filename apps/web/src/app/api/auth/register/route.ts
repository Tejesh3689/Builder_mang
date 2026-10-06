import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Public registration is disabled. Accounts must be provisioned by an administrator.' },
    { status: 403 }
  );
}
