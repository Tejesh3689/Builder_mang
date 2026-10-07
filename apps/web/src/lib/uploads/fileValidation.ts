import { badRequest, payloadTooLarge, unsupportedMediaType } from '@/lib/http/errors';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

interface FileKind {
  ext: string[];
  mime: string[];
  label: string;
  /** Returns true when the leading bytes match this format. */
  magic: (b: Uint8Array) => boolean;
}

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const isZip = (b: Uint8Array) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]);

/** Allowlist of document types. Detection is by content (magic bytes), never by the client's MIME/extension alone. */
const KINDS: FileKind[] = [
  { label: 'PDF', ext: ['pdf'], mime: ['application/pdf'], magic: (b) => startsWith(b, ascii('%PDF-')) },
  { label: 'PNG', ext: ['png'], mime: ['image/png'], magic: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { label: 'JPEG', ext: ['jpg', 'jpeg'], mime: ['image/jpeg'], magic: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  { label: 'WEBP', ext: ['webp'], mime: ['image/webp'], magic: (b) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8) },
  {
    label: 'DOCX', ext: ['docx'],
    mime: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    magic: isZip,
  },
  {
    label: 'XLSX', ext: ['xlsx'],
    mime: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    magic: isZip,
  },
];

export const ALLOWED_UPLOAD_TYPES = KINDS.map((k) => k.label).join(', ');

/**
 * Cleans a client-supplied filename for display/download only — it is never used
 * as a storage path. Rejects null bytes and path traversal outright.
 */
export function sanitizeFilename(raw: string): string {
  if (raw.includes('\0')) throw badRequest('Filename contains invalid characters', 'file');
  const base = raw.split(/[\\/]/).pop() ?? '';
  if (base === '.' || base === '..' || /(^|[\\/])\.\.([\\/]|$)/.test(raw)) {
    throw badRequest('Filename is invalid', 'file');
  }
  const cleaned = base
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^\w.\- ()]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(-150);
  if (!cleaned || !cleaned.includes('.')) throw badRequest('Filename must include an extension', 'file');
  return cleaned;
}

export interface ValidatedFile {
  bytes: Uint8Array;
  filename: string;
  ext: string;
  mime: string;
  label: string;
  size: number;
}

/** Size, extension, declared MIME and content must all agree with one allowlisted type. */
export function validateUpload(file: { name: string; type: string; bytes: Uint8Array }): ValidatedFile {
  if (file.bytes.byteLength === 0) throw badRequest('File is empty', 'file');
  if (file.bytes.byteLength > MAX_UPLOAD_BYTES) throw payloadTooLarge(`File exceeds the ${MAX_UPLOAD_BYTES / 1024 / 1024} MB limit`);

  const filename = sanitizeFilename(file.name);
  const ext = filename.split('.').pop()!.toLowerCase();
  const kind = KINDS.find((k) => k.ext.includes(ext));
  if (!kind) throw unsupportedMediaType(`File type .${ext} is not allowed. Allowed: ${ALLOWED_UPLOAD_TYPES}`);

  const declared = (file.type || '').split(';')[0].trim().toLowerCase();
  if (declared && declared !== 'application/octet-stream' && !kind.mime.includes(declared)) {
    throw unsupportedMediaType('File MIME type does not match its extension');
  }
  if (!kind.magic(file.bytes)) throw unsupportedMediaType(`File content is not a valid ${kind.label}`);

  return { bytes: file.bytes, filename, ext, mime: kind.mime[0], label: kind.label, size: file.bytes.byteLength };
}
