import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any) {
  console.error('[API Error]', error);

  if (error instanceof ApiError || error?.name === 'ApiError') {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }

  if (error?.code === 'P2002') {
    return NextResponse.json({ success: false, error: 'Conflict: Duplicate entry' }, { status: 409 });
  }
  if (error?.code === 'P2003') {
    return NextResponse.json({ success: false, error: 'Bad Request: Referenced resource not found or invalid' }, { status: 400 });
  }
  if (error?.code === 'P2025') {
    return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
  }
  // Contention errors that survived retries: the request was valid, the client should retry.
  if (error?.code === 'P2034') {
    return NextResponse.json({ success: false, error: 'CONFLICT_RETRY', retryable: true }, { status: 409 });
  }
  if (error?.code === 'P2028' || error?.code === 'P2024') {
    return NextResponse.json({ success: false, error: 'SERVICE_BUSY_RETRY', retryable: true }, { status: 503, headers: { 'Retry-After': '1' } });
  }
  if (error?.name === 'ZodError') {
    return NextResponse.json({ success: false, error: 'Validation Error', details: error.errors }, { status: 400 });
  }
  if (error?.message === 'Unauthorized') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
}

export async function parseJsonSafe(req: Request) {
  try {
    return await req.json();
  } catch (e) {
    throw new ApiError(400, 'Malformed JSON');
  }
}
