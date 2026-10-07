import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma, EmployeeStatus } from '@prisma/client';
import { z } from 'zod';
import { ApiError, badRequest, conflict, toErrorResponse } from '@/lib/http/errors';
import { readJsonObject, parseBody } from '@/lib/http/request';
import { apiHandler } from '@/lib/http/handler';
import { isAccountUsable } from '@/lib/policies/account';

const json = async (res: Response) => ({ status: res.status, body: await res.json() });

const knownError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('raw internal prisma text', { code, clientVersion: 'test', meta });

describe('central error mapper', () => {
  test('P2002 -> 409 with resource name, no raw text', async () => {
    const { status, body } = await json(toErrorResponse(knownError('P2002', { target: ['code'] }), { resource: 'venture' }));
    assert.equal(status, 409);
    assert.equal(body.error, 'A venture with this code already exists.');
    assert.ok(!JSON.stringify(body).includes('raw internal'));
  });

  test('P2003 -> 400 with the FK column as field', async () => {
    const { status, body } = await json(toErrorResponse(knownError('P2003', { field_name: 'ventures_projectDirectorId_fkey (index)' })));
    assert.equal(status, 400);
    assert.equal(body.field, 'projectDirectorId');
    assert.equal(body.code, 'INVALID_REFERENCE');
  });

  test('P2025 -> 404', async () => {
    const { status, body } = await json(toErrorResponse(knownError('P2025'), { resource: 'employee' }));
    assert.equal(status, 404);
    assert.equal(body.error, 'Employee not found');
  });

  test('PrismaClientValidationError -> 400 generic (never the query dump)', async () => {
    const err = new Prisma.PrismaClientValidationError('Invalid `prisma.venture.create()` invocation: { data: { name: 12345 } }', { clientVersion: 'test' });
    const { status, body } = await json(toErrorResponse(err));
    assert.equal(status, 400);
    assert.equal(body.error, 'Invalid request data');
    assert.ok(!JSON.stringify(body).includes('prisma.venture'));
  });

  test('ZodError -> 400 with field and all issues', async () => {
    const r = z.object({ name: z.string({ invalid_type_error: 'name must be a string' }) }).safeParse({ name: 1 });
    assert.equal(r.success, false);
    const { status, body } = await json(toErrorResponse((r as any).error));
    assert.equal(status, 400);
    assert.equal(body.field, 'name');
    assert.equal(body.error, 'name must be a string');
    assert.equal(body.details.issues.length, 1);
  });

  test('ApiError carries status/code/field/details', async () => {
    const { status, body } = await json(toErrorResponse(conflict('Busy', { x: 1 })));
    assert.equal(status, 409);
    assert.deepEqual(body.details, { x: 1 });
    const bad = await json(toErrorResponse(badRequest('nope', 'f')));
    assert.equal(bad.body.field, 'f');
  });

  test('legacy Unauthorized/Forbidden errors -> 401/403', async () => {
    assert.equal(toErrorResponse(new Error('Unauthorized')).status, 401);
    assert.equal(toErrorResponse(new Error('Forbidden')).status, 403);
  });

  test('unexpected error -> generic 500, message hidden', async () => {
    const orig = console.error;
    console.error = () => {};
    try {
      const { status, body } = await json(toErrorResponse(new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2')));
      assert.equal(status, 500);
      assert.equal(body.error, 'Internal server error');
    } finally {
      console.error = orig;
    }
  });

  test('apiHandler routes thrown errors through the mapper', async () => {
    const handler = apiHandler(async () => {
      throw new ApiError(418, 'teapot', 'TEAPOT');
    });
    const res = await handler(new Request('http://x'), {});
    assert.equal(res.status, 418);
  });
});

describe('safe JSON parsing', () => {
  const req = (body: string, contentType = 'application/json') =>
    new Request('http://x', { method: 'POST', body, headers: { 'content-type': contentType } });

  for (const [label, body] of [
    ['malformed', '{"name": '],
    ['empty', ''],
    ['array', '[1,2]'],
    ['null', 'null'],
    ['number', '42'],
  ] as const) {
    test(`${label} body -> clean 400`, async () => {
      await assert.rejects(readJsonObject(req(body)), (e: any) => e instanceof ApiError && e.status === 400);
    });
  }

  test('wrong content-type -> 415', async () => {
    await assert.rejects(readJsonObject(req('{}', 'text/plain')), (e: any) => e.status === 415);
  });

  test('oversized body -> 413', async () => {
    const big = JSON.stringify({ x: 'a'.repeat(1024 * 1024 + 10) });
    await assert.rejects(readJsonObject(req(big)), (e: any) => e.status === 413);
  });

  test('valid object parses; parseBody validates', async () => {
    assert.deepEqual(await readJsonObject(req('{"a":1}')), { a: 1 });
    await assert.rejects(parseBody(req('{"a":"x"}'), z.object({ a: z.number() })), (e: any) => e instanceof z.ZodError);
  });
});

describe('account policy', () => {
  test('active user with active/no employee is usable', () => {
    assert.equal(isAccountUsable({ isActive: true }), true);
    assert.equal(isAccountUsable({ isActive: true, employee: { status: EmployeeStatus.ON_LEAVE } }), true);
  });
  test('inactive user, terminated employee, or missing user is not', () => {
    assert.equal(isAccountUsable({ isActive: false }), false);
    assert.equal(isAccountUsable({ isActive: true, employee: { status: EmployeeStatus.TERMINATED } }), false);
    assert.equal(isAccountUsable(null), false);
  });
});
