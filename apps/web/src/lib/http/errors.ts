import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * An error that is safe to show to the client. Anything that is not an ApiError,
 * a ZodError or a known Prisma error is reported as a generic 500.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string, field?: string) => new ApiError(400, message, 'BAD_REQUEST', field);
// Message stays 'Unauthorized' / 'Forbidden' so legacy `error.message === 'Unauthorized'` checks keep working.
export const unauthorized = (message = 'Unauthorized') => new ApiError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'Forbidden') => new ApiError(403, message, 'FORBIDDEN');
export const notFound = (message = 'Not found') => new ApiError(404, message, 'NOT_FOUND');
export const conflict = (message: string, details?: Record<string, unknown>) =>
  new ApiError(409, message, 'CONFLICT', undefined, details);
export const payloadTooLarge = (message: string) => new ApiError(413, message, 'PAYLOAD_TOO_LARGE');
export const unsupportedMediaType = (message: string) => new ApiError(415, message, 'UNSUPPORTED_MEDIA_TYPE');
export const serviceUnavailable = (message: string) => new ApiError(503, message, 'SERVICE_UNAVAILABLE');

export interface ErrorContext {
  /** Human name of the main resource, used in mapped messages ("venture", "employee"). */
  resource?: string;
  /** Short label for server logs. */
  context?: string;
}

type ErrorBody = {
  success: false;
  error: string;
  code: string;
  field?: string;
  details?: Record<string, unknown>;
};

function body(status: number, error: string, code: string, extra: Partial<ErrorBody> = {}) {
  return NextResponse.json<ErrorBody>({ success: false, error, code, ...extra }, { status });
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Pulls the column name out of Prisma's FK meta, e.g. "ventures_projectDirectorId_fkey (index)" -> "projectDirectorId". */
function fkField(meta: Record<string, unknown> | undefined): string | undefined {
  const raw = typeof meta?.field_name === 'string' ? meta.field_name : undefined;
  const match = raw?.match(/^[a-z_]+?_([A-Za-z]+)_fkey/);
  return match?.[1];
}

/**
 * The single place where thrown errors become HTTP responses.
 * Never forwards raw Prisma / Postgres / JS error messages to the client.
 */
export function toErrorResponse(error: unknown, ctx: ErrorContext = {}): NextResponse {
  const resource = ctx.resource ?? 'record';

  if (error instanceof ApiError) {
    return body(error.status, error.message, error.code, { field: error.field, details: error.details });
  }

  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join('.') || undefined;
    return body(400, issue?.message || 'Invalid request body', 'VALIDATION_ERROR', {
      field,
      details: { issues: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) },
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target;
        const fields = Array.isArray(target) ? target.join(', ') : typeof target === 'string' ? target : undefined;
        return body(409, `A ${resource} with this ${fields ?? 'value'} already exists.`, 'CONFLICT', { field: fields });
      }
      case 'P2003':
        return body(400, 'A referenced record does not exist.', 'INVALID_REFERENCE', { field: fkField(error.meta) });
      case 'P2025':
        return body(404, `${capitalise(resource)} not found`, 'NOT_FOUND');
      case 'P2000':
        return body(400, 'A value is too long.', 'VALIDATION_ERROR');
      case 'P2034':
        return body(409, 'The record was changed by another request. Please retry.', 'CONFLICT');
      case 'P2028':
      case 'P2024':
        return body(503, 'The server is busy. Please retry.', 'SERVICE_BUSY');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error(`[api] Prisma validation error${ctx.context ? ` in ${ctx.context}` : ''}:`, error);
    return body(400, 'Invalid request data', 'VALIDATION_ERROR');
  }

  // Legacy helpers throw plain Errors with these messages.
  if (error instanceof Error && error.message === 'Unauthorized') return body(401, 'Unauthorized', 'UNAUTHORIZED');
  if (error instanceof Error && error.message === 'Forbidden') return body(403, 'Forbidden', 'FORBIDDEN');
  // Malformed JSON from a raw `req.json()` call.
  if (error instanceof SyntaxError) return body(400, 'Request body must be valid JSON', 'BAD_REQUEST');

  console.error(`[api] Unhandled error${ctx.context ? ` in ${ctx.context}` : ''}:`, error);
  return body(500, 'Internal server error', 'INTERNAL_ERROR');
}
