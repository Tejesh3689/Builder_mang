import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

import { NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

export async function POST(req: Request, context: any) {
  if (req.headers.get('content-type')?.includes('application/json')) {
    try {
      const cloned = req.clone();
      await cloned.json();
    } catch (e: any) {
      return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
    }
  }
  return handler(req, context);
}
export { handler as GET };
