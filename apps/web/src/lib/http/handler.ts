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
    let retries = 0;
    while (true) {
      try {
        return await handler(req, ctx);
      } catch (error: any) {
        if (retries < 2 && error?.code === 'P1001') {
          console.log(`[RETRY] Retrying after P1001 (Attempt ${retries + 1}/2)...`);
          await new Promise((res) => setTimeout(res, 500));
          retries++;
          continue;
        }
        return toErrorResponse(error, errorContext);
      }
    }
  };
}

export const ok = <T>(data: T, status = 200) => NextResponse.json({ success: true, data }, { status });
export const created = <T>(data: T) => ok(data, 201);
