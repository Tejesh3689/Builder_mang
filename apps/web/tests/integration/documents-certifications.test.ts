import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { actAs, assign, call, makeEmployee, makeUser, makeVenture, prisma } from './helpers';
import { businessToday, toDateOnlyString } from '@/lib/validation/common';

const empDocs = await import('@/app/api/employees/[id]/documents/route');
const docItem = await import('@/app/api/documents/[id]/route');
const docFile = await import('@/app/api/documents/[id]/file/route');
const ventureDocs = await import('@/app/api/ventures/[ventureId]/documents/route');
const ventureDocFile = await import('@/app/api/ventures/[ventureId]/documents/[documentId]/file/route');
const certs = await import('@/app/api/employees/[id]/certifications/route');
const certItem = await import('@/app/api/certifications/[id]/route');

const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from('hello document')]);
const EXE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]);

let admin: Awaited<ReturnType<typeof makeUser>>;
let manager: Awaited<ReturnType<typeof makeUser>>;
let supervisor: Awaited<ReturnType<typeof makeUser>>;

before(async () => {
  admin = await makeUser('ADMIN');
  manager = await makeUser('MANAGER');
  supervisor = await makeUser('SUPERVISOR');
});

const upload = (handler: any, params: Record<string, string>, file: Buffer, name: string, type = 'application/pdf', extra: Record<string, string> = {}) => {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file)], { type }), name);
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return call(handler, { method: 'POST', params, rawBody: form });
};

describe('employee document upload', () => {
  test('real upload -> stored privately, downloadable with identical bytes', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const r = await upload(empDocs.POST, { id: e.id }, PDF, 'aadhaar.pdf', 'application/pdf', { name: 'Aadhaar' });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    const doc = r.json.data;
    assert.equal(doc.fileUrl, `/api/documents/${doc.id}/file`);
    assert.match(doc.storageKey, new RegExp(`^employee-documents/${e.id}/[0-9a-f-]{36}\\.pdf$`));
    assert.equal(doc.fileSize, PDF.length);

    const dl = await call(docFile.GET, { params: { id: doc.id } });
    assert.equal(dl.status, 200);
    assert.equal(dl.res.headers.get('x-content-type-options'), 'nosniff');
    assert.match(dl.res.headers.get('content-disposition')!, /^attachment;/);
    assert.deepEqual(Buffer.from(await dl.res.arrayBuffer()), PDF);
  });

  test('placeholder JSON "uploads" are rejected (no client-controlled URLs)', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const r = await call(empDocs.POST, { method: 'POST', params: { id: e.id }, body: { name: 'x', fileUrl: '/docs/placeholder.pdf' } });
    assert.equal(r.status, 415);
  });

  test('disguised executable, disallowed type, traversal and null-byte names are rejected', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    assert.equal((await upload(empDocs.POST, { id: e.id }, EXE, 'invoice.pdf')).status, 415);
    assert.equal((await upload(empDocs.POST, { id: e.id }, EXE, 'run.exe', 'application/octet-stream')).status, 415);
    assert.equal((await upload(empDocs.POST, { id: e.id }, PDF, '..\\..\\x.pdf')).status, 400);
    assert.equal((await upload(empDocs.POST, { id: e.id }, PDF, 'a.pdf\0.exe')).status, 400);
    assert.equal(await prisma.employeeDocument.count({ where: { employeeId: e.id } }), 0);
  });

  test('scope: out-of-scope employee docs cannot be listed, downloaded or deleted', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const doc = (await upload(empDocs.POST, { id: e.id }, PDF, 'x.pdf')).json.data;
    actAs(manager.id);
    assert.equal((await call(empDocs.GET, { params: { id: e.id } })).status, 404);
    assert.equal((await call(docFile.GET, { params: { id: doc.id } })).status, 404);
    assert.equal((await call(docItem.DELETE, { method: 'DELETE', params: { id: doc.id } })).status, 404);
    actAs(admin.id);
    assert.equal((await call(docItem.DELETE, { method: 'DELETE', params: { id: doc.id } })).status, 200);
    assert.equal((await call(docFile.GET, { params: { id: doc.id } })).status, 404);
  });

  test('legacy placeholder rows report "no file" instead of pretending', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const legacy = await prisma.employeeDocument.create({ data: { employeeId: e.id, name: 'old', fileUrl: '/docs/placeholder.pdf', fileType: 'PDF' } });
    const r = await call(docFile.GET, { params: { id: legacy.id } });
    assert.equal(r.status, 404);
    assert.equal(r.json.error, 'No file is stored for this document');
  });
});

describe('venture document upload', () => {
  test('upload + visibility enforced on download', async () => {
    actAs(admin.id);
    const v = await makeVenture();
    await assign(supervisor.employee!.id, v.id);
    const r = await upload(ventureDocs.POST, { ventureId: v.id }, PDF, 'plan.pdf', 'application/pdf', { category: 'DRAWINGS', visibility: 'MANAGEMENT' });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.data.category, 'DRAWINGS');
    const params = { ventureId: v.id, documentId: r.json.data.id };
    assert.equal((await call(ventureDocFile.GET, { params })).status, 200);

    actAs(supervisor.id); // in scope, but MANAGEMENT-only document
    assert.equal((await call(ventureDocFile.GET, { params })).status, 404);
    const list = await call(ventureDocs.GET, { params: { ventureId: v.id } });
    assert.equal(list.json.data.length, 0);
  });

  test('invalid category -> 400', async () => {
    actAs(admin.id);
    const v = await makeVenture();
    const r = await upload(ventureDocs.POST, { ventureId: v.id }, PDF, 'plan.pdf', 'application/pdf', { category: 'SECRET' });
    assert.equal(r.status, 400);
    assert.equal(r.json.field, 'category');
  });
});

describe('certifications', () => {
  const today = toDateOnlyString(businessToday());
  const add = (employeeId: string, body: object) =>
    call(certs.POST, { method: 'POST', params: { id: employeeId }, body: { certification: 'Working at Height', certificateNo: 'WAH-1', ...body } });

  test('expires today -> "Expiring Soon", not Expired; stored as a pure date', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const r = await add(e.id, { issueDate: '2025-01-01', expiryDate: today });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.data.status, 'Expiring Soon');
    assert.equal(r.json.data.expiryDate, `${today}T00:00:00.000Z`);
  });

  test('issueDate after expiryDate, future issue, impossible dates -> 400', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    assert.equal((await add(e.id, { issueDate: '2026-05-01', expiryDate: '2026-04-01' })).json.field, 'issueDate');
    assert.equal((await add(e.id, { issueDate: '2099-01-01', expiryDate: '2099-06-01' })).status, 400);
    assert.equal((await add(e.id, { expiryDate: '2027-02-29' })).status, 400);
    assert.equal((await add(e.id, { expiryDate: '01/02/2027' })).status, 400);
  });

  test('duplicate (same name + number, any case) -> 409; renewal with new number ok', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    assert.equal((await add(e.id, { expiryDate: '2030-01-01' })).status, 201);
    assert.equal((await add(e.id, { certificateNo: 'wah-1', certification: 'working at height', expiryDate: '2031-01-01' })).status, 409);
    assert.equal((await add(e.id, { certificateNo: 'WAH-2', expiryDate: '2031-01-01' })).status, 201);
  });

  test('PATCH recomputes status and ignores client-supplied status', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const c = (await add(e.id, { expiryDate: '2030-01-01' })).json.data;
    const r = await call(certItem.PATCH, { method: 'PATCH', params: { id: c.id }, body: { expiryDate: '2020-01-01', issueDate: '2019-01-01', status: 'Valid' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.status, 'Expired');
  });

  test('scope: out-of-scope certifications are invisible', async () => {
    actAs(admin.id);
    const e = await makeEmployee();
    const c = (await add(e.id, { expiryDate: '2030-01-01' })).json.data;
    actAs(manager.id);
    assert.equal((await call(certs.GET, { params: { id: e.id } })).status, 404);
    assert.equal((await call(certItem.DELETE, { method: 'DELETE', params: { id: c.id } })).status, 404);
  });
});
