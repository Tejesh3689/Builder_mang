import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_UPLOAD_BYTES, sanitizeFilename, validateUpload } from '@/lib/uploads/fileValidation';
import { generateStorageKey } from '@/lib/uploads/storage';
import { readMultipart } from '@/lib/uploads/multipart';

const PDF = new Uint8Array([...Buffer.from('%PDF-1.7\n'), 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

describe('filename sanitisation', () => {
  test('strips directories and unsafe characters', () => {
    assert.equal(sanitizeFilename('C:\\Users\\x\\aadhaar card.pdf'), 'aadhaar card.pdf');
    assert.equal(sanitizeFilename('a<b>"c".pdf'), 'a_b__c_.pdf');
    assert.equal(sanitizeFilename('.hidden.pdf'), 'hidden.pdf');
  });
  test('rejects null bytes, traversal, missing extension', () => {
    assert.throws(() => sanitizeFilename('evil.pdf\0.exe'), /invalid characters/);
    assert.throws(() => sanitizeFilename('../../etc/passwd'));
    assert.throws(() => sanitizeFilename('..\\..\\boot.pdf'), /invalid/);
    assert.throws(() => sanitizeFilename('README'), /extension/);
  });
});

describe('upload validation', () => {
  test('accepts matching extension + MIME + magic bytes', () => {
    const f = validateUpload({ name: 'id.pdf', type: 'application/pdf', bytes: PDF });
    assert.equal(f.label, 'PDF');
    assert.equal(validateUpload({ name: 'site.PNG', type: '', bytes: PNG }).ext, 'png');
  });
  test('rejects disguised content (magic-byte check)', () => {
    assert.throws(() => validateUpload({ name: 'id.pdf', type: 'application/pdf', bytes: EXE }), (e: any) => e.status === 415);
    assert.throws(() => validateUpload({ name: 'photo.png', type: 'image/png', bytes: PDF }), (e: any) => e.status === 415);
  });
  test('rejects disallowed extension and MIME mismatch', () => {
    assert.throws(() => validateUpload({ name: 'run.exe', type: 'application/octet-stream', bytes: EXE }), (e: any) => e.status === 415);
    assert.throws(() => validateUpload({ name: 'id.pdf', type: 'image/png', bytes: PDF }), /MIME/);
  });
  test('rejects empty and oversized files', () => {
    assert.throws(() => validateUpload({ name: 'a.pdf', type: '', bytes: new Uint8Array() }), (e: any) => e.status === 400);
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(PDF);
    assert.throws(() => validateUpload({ name: 'a.pdf', type: '', bytes: big }), (e: any) => e.status === 413);
  });
});

describe('storage keys', () => {
  test('server-generated and path-safe', () => {
    const key = generateStorageKey('employee-documents', '1b2c3d4e-0000-4000-8000-000000000000', 'PDF');
    assert.match(key, /^employee-documents\/1b2c3d4e-0000-4000-8000-000000000000\/[0-9a-f-]{36}\.pdf$/);
    const stripped = generateStorageKey('venture-documents', '../../x', 'pdf');
    assert.ok(!stripped.includes('..'));
  });
});

describe('multipart reading', () => {
  test('rejects non-multipart and oversized bodies', async () => {
    await assert.rejects(readMultipart(new Request('http://x', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } })), (e: any) => e.status === 415);
    const big = new Request('http://x', {
      method: 'POST',
      body: new Uint8Array(MAX_UPLOAD_BYTES + 200 * 1024),
      headers: { 'content-type': 'multipart/form-data; boundary=x' },
    });
    await assert.rejects(readMultipart(big), (e: any) => e.status === 413);
  });
  test('parses a real form', async () => {
    const form = new FormData();
    form.append('file', new Blob([PDF], { type: 'application/pdf' }), 'a.pdf');
    form.append('name', 'Doc');
    const req = new Request('http://x', { method: 'POST', body: form });
    const parsed = await readMultipart(req);
    assert.equal(parsed.get('name'), 'Doc');
  });
});
