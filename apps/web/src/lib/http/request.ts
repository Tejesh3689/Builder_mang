import { z } from 'zod';
import { badRequest, payloadTooLarge, unsupportedMediaType } from './errors';

const MAX_JSON_BYTES = 1024 * 1024; // 1 MB — JSON bodies here are small forms

/**
 * Reads a JSON request body. Malformed, empty, oversized or non-object bodies
 * always produce a clean 400/413 instead of an unhandled SyntaxError.
 */
export async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    throw unsupportedMediaType('Content-Type must be application/json');
  }
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_JSON_BYTES) throw payloadTooLarge('Request body is too large');

  let text: string;
  try {
    text = await req.text();
  } catch {
    throw badRequest('Request body could not be read');
  }
  if (Buffer.byteLength(text, 'utf8') > MAX_JSON_BYTES) throw payloadTooLarge('Request body is too large');
  if (!text.trim()) throw badRequest('Request body is required');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw badRequest('Request body must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

/** Reads the JSON body and validates it. A ZodError propagates to the central mapper (-> 400). */
export async function parseBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  return schema.parse(await readJsonObject(req));
}
