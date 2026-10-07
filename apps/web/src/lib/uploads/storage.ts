import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '@/lib/storage';
import { serviceUnavailable } from '@/lib/http/errors';

/**
 * Private file storage. Keys are always generated here (`<area>/<ownerId>/<uuid>.<ext>`);
 * clients never supply a path. Files are never served statically — downloads go
 * through an authenticated, scope-checked API route.
 *
 * Driver: STORAGE_DRIVER=s3 uses the configured bucket; otherwise files go to a
 * private local directory (UPLOAD_DIR, default <cwd>/storage/uploads), which is
 * outside /public. In a container the local directory must be a persistent volume.
 */

export type StorageArea = 'employee-documents' | 'venture-documents';

const KEY_RE = /^(employee-documents|venture-documents)\/[A-Za-z0-9-]{1,64}\/[0-9a-f-]{36}\.[a-z0-9]{1,8}$/;

export function generateStorageKey(area: StorageArea, ownerId: string, ext: string): string {
  const owner = ownerId.replace(/[^A-Za-z0-9-]/g, '');
  const key = `${area}/${owner}/${randomUUID()}.${ext.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  assertValidKey(key);
  return key;
}

function assertValidKey(key: string) {
  if (!KEY_RE.test(key)) throw new Error(`Refusing invalid storage key: ${key}`);
}

const useS3 = () => process.env.STORAGE_DRIVER === 's3';
const localRoot = () => path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'storage', 'uploads'));

function localPath(key: string) {
  assertValidKey(key);
  const root = localRoot();
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('Storage path escaped its root');
  return full;
}

export async function putObject(key: string, bytes: Uint8Array, contentType: string) {
  if (useS3()) {
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) throw serviceUnavailable('File storage is not configured');
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType }));
    return;
  }
  const full = localPath(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, bytes, { flag: 'wx' });
}

export async function getObject(key: string): Promise<Uint8Array | null> {
  if (useS3()) {
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) throw serviceUnavailable('File storage is not configured');
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return res.Body ? await res.Body.transformToByteArray() : null;
    } catch (e: any) {
      if (e?.name === 'NoSuchKey') return null;
      throw e;
    }
  }
  try {
    return new Uint8Array(await fs.readFile(localPath(key)));
  } catch (e: any) {
    if (e?.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteObject(key: string) {
  try {
    if (useS3()) {
      const bucket = process.env.AWS_BUCKET_NAME;
      if (bucket) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return;
    }
    await fs.unlink(localPath(key));
  } catch (e: any) {
    // The DB row is the source of truth; an orphaned blob is logged, not fatal.
    if (e?.code !== 'ENOENT') console.error('[storage] failed to delete object', key, e);
  }
}
