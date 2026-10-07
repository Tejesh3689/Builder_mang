import { badRequest, payloadTooLarge, unsupportedMediaType } from '@/lib/http/errors';
import { MAX_UPLOAD_BYTES } from './fileValidation';

const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024; // file + form fields/boundaries

/**
 * Reads a multipart/form-data body with a hard byte cap enforced while streaming,
 * so an oversized upload is rejected without buffering the whole thing.
 */
export async function readMultipart(req: Request): Promise<FormData> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    throw unsupportedMediaType('Uploads must be sent as multipart/form-data with a "file" field');
  }
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw payloadTooLarge('Upload is too large');
  if (!req.body) throw badRequest('Upload body is required');

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw payloadTooLarge('Upload is too large');
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return await new Response(body, { headers: { 'content-type': contentType } }).formData();
  } catch {
    throw badRequest('Malformed multipart body');
  }
}

/** Extracts the single "file" part as bytes. */
export async function getFilePart(form: FormData, field = 'file') {
  const file = form.get(field);
  if (!file || typeof file === 'string') throw badRequest(`"${field}" must be a file`, field);
  return { name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) };
}

/** Text fields of the form as a plain object (for Zod validation). */
export function formFields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === 'string') out[k] = v;
  return out;
}
