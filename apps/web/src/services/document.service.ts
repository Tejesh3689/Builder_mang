import { randomUUID } from 'crypto';
import { z } from 'zod';
import { DocumentCategory, type EmployeeDocument, type VentureDocument } from '@prisma/client';
import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { notFound } from '@/lib/http/errors';
import { optionalText } from '@/lib/validation/common';
import { validateUpload } from '@/lib/uploads/fileValidation';
import { formFields, getFilePart } from '@/lib/uploads/multipart';
import { deleteObject, generateStorageKey, getObject, putObject, type StorageArea } from '@/lib/uploads/storage';

type Actor = { id: string };

const employeeDocFields = z.object({
  name: optionalText('name', 200),
});

const ventureDocFields = z.object({
  title: optionalText('title', 200),
  category: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.nativeEnum(DocumentCategory, { errorMap: () => ({ message: 'category is invalid' }) }).default(DocumentCategory.OTHER)
  ),
  version: optionalText('version', 20),
  visibility: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.enum(['ALL', 'MANAGEMENT'], { errorMap: () => ({ message: 'visibility must be ALL or MANAGEMENT' }) }).default('ALL')
  ),
});

/** Management roles see every venture document; everyone else only visibility=ALL. */
export const ventureDocumentVisibility = (role: string) =>
  ['ADMIN', 'MANAGER'].includes(role) ? {} : { visibility: 'ALL' };

/** Stores the blob, then the row; if the row fails the blob is removed again. */
async function storeThenRecord<T>(area: StorageArea, ownerId: string, file: ReturnType<typeof validateUpload>, record: (key: string) => Promise<T>) {
  const key = generateStorageKey(area, ownerId, file.ext);
  await putObject(key, file.bytes, file.mime);
  try {
    return await record(key);
  } catch (e) {
    await deleteObject(key);
    throw e;
  }
}

export async function uploadEmployeeDocument(actor: Actor, employeeId: string, form: FormData) {
  const fields = employeeDocFields.parse(formFields(form));
  const file = validateUpload(await getFilePart(form));
  const id = randomUUID();

  return storeThenRecord('employee-documents', employeeId, file, (storageKey) =>
    prisma.$transaction(async (tx) => {
      const doc = await tx.employeeDocument.create({
        data: {
          id,
          employeeId,
          name: fields.name ?? file.filename,
          fileUrl: `/api/documents/${id}/file`,
          fileType: file.label,
          mimeType: file.mime,
          fileSize: file.size,
          storageKey,
          uploadedById: actor.id,
        },
      });
      await recordAudit(tx, {
        userId: actor.id,
        action: 'UPLOAD_EMPLOYEE_DOCUMENT',
        details: { employeeId, documentId: id, name: doc.name, size: file.size, type: file.label },
      });
      return doc;
    })
  );
}

export async function uploadVentureDocument(actor: Actor, ventureId: string, form: FormData) {
  const fields = ventureDocFields.parse(formFields(form));
  const file = validateUpload(await getFilePart(form));
  const id = randomUUID();

  return storeThenRecord('venture-documents', ventureId, file, (storageKey) =>
    prisma.$transaction(async (tx) => {
      const doc = await tx.ventureDocument.create({
        data: {
          id,
          ventureId,
          title: fields.title ?? file.filename,
          category: fields.category,
          version: fields.version ?? '1.0',
          visibility: fields.visibility,
          fileUrl: `/api/ventures/${ventureId}/documents/${id}/file`,
          fileType: file.mime,
          fileSize: file.size,
          storageKey,
          uploadedById: actor.id,
        },
      });
      await recordAudit(tx, {
        userId: actor.id,
        action: 'UPLOAD_VENTURE_DOCUMENT',
        ventureId,
        details: { documentId: id, title: doc.title, size: file.size, type: file.label },
      });
      return doc;
    })
  );
}

export async function deleteEmployeeDocument(actor: Actor, doc: EmployeeDocument) {
  await prisma.$transaction(async (tx) => {
    await tx.employeeDocument.delete({ where: { id: doc.id } });
    await recordAudit(tx, {
      userId: actor.id,
      action: 'DELETE_EMPLOYEE_DOCUMENT',
      details: { employeeId: doc.employeeId, documentId: doc.id, name: doc.name },
    });
  });
  if (doc.storageKey) await deleteObject(doc.storageKey);
}

/** Builds a safe download response for a stored document. Legacy rows without a stored file -> 404. */
export async function downloadResponse(doc: Pick<EmployeeDocument | VentureDocument, 'storageKey'> & { name?: string; title?: string; mimeType?: string | null; fileType: string }) {
  if (!doc.storageKey) throw notFound('No file is stored for this document');
  const bytes = await getObject(doc.storageKey);
  if (!bytes) throw notFound('File not found');

  const display = (doc.name ?? doc.title ?? 'document').replace(/[^\w.\- ()]/g, '_');
  const contentType = doc.mimeType ?? (doc.fileType.includes('/') ? doc.fileType : 'application/octet-stream');
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `attachment; filename="${display}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
