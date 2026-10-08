import { randomUUID } from 'crypto';
import { z } from 'zod';
import { type MaterialAttachment } from '@prisma/client';
import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { notFound, conflict } from '@/lib/http/errors';
import { validateUpload } from '@/lib/uploads/fileValidation';
import { formFields, getFilePart } from '@/lib/uploads/multipart';
import { deleteObject, generateStorageKey, getObject, putObject } from '@/lib/uploads/storage';

type Actor = { id: string };

/** Stores the blob, then the row; if the row fails the blob is removed again. */
async function storeThenRecord<T>(area: any, ownerId: string, file: ReturnType<typeof validateUpload>, record: (key: string) => Promise<T>) {
  const key = generateStorageKey(area, ownerId, file.ext);
  await putObject(key, file.bytes, file.mime);
  try {
    return await record(key);
  } catch (e) {
    await deleteObject(key);
    throw e;
  }
}

export async function uploadMaterialAttachment(actor: Actor, entityType: string, entityId: string, form: FormData) {
  const file = validateUpload(await getFilePart(form));
  const id = randomUUID();

  return storeThenRecord('material-attachments' as any, entityId, file, (storageKey) =>
    prisma.$transaction(async (tx) => {
      const doc = await tx.materialAttachment.create({
        data: {
          id,
          entityType,
          entityId,
          fileName: file.filename,
          storageKey,
          mimeType: file.mime,
          fileSize: file.size,
          uploadedById: actor.id,
        },
      });
      await recordAudit(tx, {
        userId: actor.id,
        action: 'UPLOAD_MATERIAL_ATTACHMENT',
        details: { entityType, entityId, attachmentId: id, fileName: doc.fileName, size: file.size },
      });
      return doc;
    })
  );
}

export async function downloadMaterialAttachment(doc: Pick<MaterialAttachment, 'storageKey' | 'fileName' | 'mimeType'>) {
  if (!doc.storageKey) throw notFound('No file is stored for this attachment');
  const bytes = await getObject(doc.storageKey);
  if (!bytes) throw notFound('File not found');

  const display = doc.fileName.replace(/[^\w.\- ()]/g, '_');
  const contentType = doc.mimeType ?? 'application/octet-stream';
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
