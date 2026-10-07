import { NextResponse } from 'next/server';
import { toErrorResponse, type ErrorContext } from './errors';

/**
 * Wraps a route handler so every thrown error goes through the central mapper.
 *
 * Route convention:
 *   parse -> authenticate -> permission -> scope -> validate -> business rules
 *   -> service (transaction + audit) -> response
 * Handlers stay thin: they call lib/authorization, lib/scope and a service, and
 * signal failures by throwing ApiError (lib/http/errors).
 */
export function apiHandler<Ctx = unknown>(
  handler: (req: Request, ctx: Ctx) => Promise<Response>,
  errorContext: ErrorContext = {}
) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return toErrorResponse(error, errorContext);
    }
  };
}

export const ok = <T>(data: T, status = 200) => NextResponse.json({ success: true, data }, { status });
export const created = <T>(data: T) => ok(data, 201);
