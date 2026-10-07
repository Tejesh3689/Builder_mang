import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { businessToday, parseDateOnly, parseDateOrDateTime } from '@/lib/validation/common';
import { ventureCreateSchema, ventureUpdateSchema, assertDateOrder, assertCoordinatePair } from '@/lib/validation/venture';
import { employeeCreateSchema, employeeUpdateSchema, normalizePhone } from '@/lib/validation/employee';
import { assignmentCreateSchema, assignmentUpdateSchema } from '@/lib/validation/assignment';
import {
  assertCertificationDates,
  certificationCreateSchema,
  certificationStatus,
  certificationUpdateSchema,
} from '@/lib/validation/certification';

const firstIssue = (r: any) => (r.success ? null : r.error.issues[0].message);
const d = (s: string) => parseDateOnly(s)!;

describe('dates', () => {
  test('strict date-only rejects impossible dates instead of rolling over', () => {
    assert.equal(parseDateOnly('2026-02-29'), null);
    assert.equal(parseDateOnly('2026-13-01'), null);
    assert.equal(parseDateOnly('31/12/2026'), null);
    assert.equal(parseDateOnly('2026-06-01T00:00:00Z'), null);
    assert.equal(parseDateOnly('2028-02-29')?.toISOString(), '2028-02-29T00:00:00.000Z');
    assert.equal(parseDateOnly('0001-01-01')?.toISOString(), '0001-01-01T00:00:00.000Z');
  });
  test('date-or-datetime accepts ISO datetimes, pins date-only to UTC midnight', () => {
    assert.equal(parseDateOrDateTime('2026-06-01')?.toISOString(), '2026-06-01T00:00:00.000Z');
    assert.equal(parseDateOrDateTime('2026-06-01T10:00:00.000Z')?.toISOString(), '2026-06-01T10:00:00.000Z');
    assert.equal(parseDateOrDateTime('2026-02-30T00:00:00Z'), null);
  });
  test('businessToday uses IST calendar day', () => {
    // 2026-10-06 20:00 UTC is already 2026-10-07 in IST
    assert.equal(businessToday(new Date('2026-10-06T20:00:00Z')).toISOString(), '2026-10-07T00:00:00.000Z');
    assert.equal(businessToday(new Date('2026-10-06T10:00:00Z')).toISOString(), '2026-10-06T00:00:00.000Z');
  });
});

describe('venture validation (VENT-03..08 regressions)', () => {
  const base = { name: 'X', code: 'C1' };
  const reject = (body: object) => firstIssue(ventureCreateSchema.safeParse(body));

  test('name rules', () => {
    assert.equal(reject({ code: 'C' }), 'name is required');
    assert.equal(reject({ ...base, name: '   ' }), 'name must not be empty');
    assert.equal(reject({ ...base, name: 'a'.repeat(201) }), 'name must be at most 200 characters');
    assert.equal(reject({ ...base, name: 12345 }), 'name must be a string');
    assert.equal(reject({ ...base, name: ['a'] }), 'name must be a string');
  });
  test('dates: invalid calendar / non-ISO rejected, blank -> null, boundaries ok', () => {
    assert.match(reject({ ...base, startDate: '2026-02-29' })!, /valid date/);
    assert.match(reject({ ...base, startDate: '31/12/2026' })!, /valid date/);
    const ok = ventureCreateSchema.parse({ ...base, startDate: '', expectedCompletionDate: '9999-12-31' });
    assert.equal(ok.startDate, null);
    assert.equal(ok.expectedCompletionDate?.toISOString(), '9999-12-31T00:00:00.000Z');
  });
  test('date order', () => {
    assert.throws(() => assertDateOrder({ startDate: d('2026-06-01'), expectedCompletionDate: d('2026-01-01') }), /expectedCompletionDate/);
    assert.throws(() => assertDateOrder({ planningStartDate: d('2026-06-01'), startDate: d('2026-01-01') }), /startDate/);
    assert.doesNotThrow(() => assertDateOrder({ planningStartDate: d('2026-01-01'), startDate: d('2026-01-01') }));
  });
  test('coordinates: range, garbage, (0,0), pairs', () => {
    assert.match(reject({ ...base, latitude: 90.0001, longitude: 0 })!, /at most 90/);
    assert.match(reject({ ...base, latitude: 0, longitude: 181 })!, /at most 180/);
    assert.match(reject({ ...base, latitude: '12.9,77.6' })!, /must be a number/);
    assert.match(reject({ ...base, latitude: 'abc', longitude: 'xyz' })!, /must be a number/);
    const zero = ventureCreateSchema.parse({ ...base, latitude: 0, longitude: 0 });
    assert.deepEqual([zero.latitude, zero.longitude], [0, 0]);
    assert.throws(() => assertCoordinatePair(12.9, null), /together/);
    assert.doesNotThrow(() => assertCoordinatePair(null, undefined));
  });
  test('progressPercentage 0..100, numbers only, not null (VENT-07)', () => {
    for (const v of [0, 0.5, 100]) assert.equal(ventureUpdateSchema.safeParse({ progressPercentage: v }).success, true);
    for (const v of [-1, 100.01, 101, '50%', '', null]) assert.equal(ventureUpdateSchema.safeParse({ progressPercentage: v }).success, false);
  });
  test('settings: only scalar toggles, legacy upsert shape unwrapped', () => {
    const r = ventureUpdateSchema.parse({ settings: { upsert: { create: { notifyOnLowStock: false }, update: { notifyOnLowStock: false } } } });
    assert.deepEqual(r.settings, { notifyOnLowStock: false });
    assert.equal(ventureUpdateSchema.safeParse({ settings: { ventureId: 'x' } }).success, false);
  });
  test('unknown keys are dropped', () => {
    const r = ventureUpdateSchema.parse({ name: 'ok', archivedBy: 'evil', id: 'x' } as any);
    assert.deepEqual(Object.keys(r).filter((k) => (r as any)[k] !== undefined), ['name']);
  });
});

describe('employee validation', () => {
  const base = { firstName: 'Ravi', designation: 'Mason' };
  test('phone normalisation', () => {
    assert.equal(normalizePhone('+91 98450 22341'), '+919845022341');
    assert.equal(normalizePhone('9845022341'), '+919845022341');
    assert.equal(normalizePhone('09845022341'), '+919845022341');
    assert.equal(normalizePhone('(+91) 98450-22341'), '+919845022341');
    assert.equal(normalizePhone('+1 415 555 2671'), '+14155552671');
    assert.equal(normalizePhone('+91 2543434534737'), null); // not a valid Indian mobile
    assert.equal(normalizePhone('12345'), null);
    assert.equal(normalizePhone('98450abc41'), null);
  });
  test('required strings trimmed, whitespace rejected', () => {
    assert.equal(firstIssue(employeeCreateSchema.safeParse({ ...base, firstName: '  ' })), 'firstName must not be empty');
    assert.equal(firstIssue(employeeCreateSchema.safeParse({ ...base, designation: '\t' })), 'designation must not be empty');
    const r = employeeCreateSchema.parse({ ...base, firstName: '  Ravi ', lastName: '  ' });
    assert.equal(r.firstName, 'Ravi');
    assert.equal(r.lastName, '');
  });
  test('email lowercased + validated', () => {
    assert.equal(employeeCreateSchema.parse({ ...base, email: ' Ravi@Example.COM ' }).email, 'ravi@example.com');
    assert.match(firstIssue(employeeCreateSchema.safeParse({ ...base, email: 'not-an-email' }))!, /valid email/);
  });
  test('enums and dates', () => {
    assert.match(firstIssue(employeeCreateSchema.safeParse({ ...base, employmentType: 'Freelance' }))!, /employmentType/);
    assert.match(firstIssue(employeeCreateSchema.safeParse({ ...base, status: 'TERMINATED' }))!, /new employee/);
    assert.match(firstIssue(employeeCreateSchema.safeParse({ ...base, joiningDate: '2026-02-29' }))!, /valid date/);
    assert.match(firstIssue(employeeCreateSchema.safeParse({ ...base, joiningDate: '1900-01-01' }))!, /between 1950/);
    assert.equal(employeeCreateSchema.parse({ ...base, ventureId: 'none' }).ventureId, null);
    assert.equal(employeeUpdateSchema.safeParse({ status: 'FIRED' }).success, false);
  });
});

describe('assignment validation', () => {
  test('accessLevel allowlist', () => {
    assert.equal(assignmentCreateSchema.safeParse({ ventureId: 'v', accessLevel: 'GOD_MODE' }).success, false);
    assert.equal(assignmentCreateSchema.parse({ ventureId: 'v' }).accessLevel, 'STANDARD');
    assert.equal(assignmentUpdateSchema.safeParse({ status: 'DELETED' }).success, false);
  });
});

describe('certifications', () => {
  const today = d('2026-10-07');
  test('status uses date-only semantics; expires today is not Expired', () => {
    assert.equal(certificationStatus(d('2026-10-07'), today), 'Expiring Soon');
    assert.equal(certificationStatus(d('2026-10-06'), today), 'Expired');
    assert.equal(certificationStatus(d('2026-11-06'), today), 'Expiring Soon'); // exactly 30 days
    assert.equal(certificationStatus(d('2026-11-07'), today), 'Valid');
  });
  test('date rules', () => {
    assert.throws(() => assertCertificationDates(d('2026-05-01'), d('2026-04-01'), today), /issueDate cannot be after/);
    assert.throws(() => assertCertificationDates(d('2027-01-01'), d('2028-01-01'), today), /issueDate must be between/);
    assert.throws(() => assertCertificationDates(d('2020-01-01'), d('2200-01-01'), today), /expiryDate must be between/);
    assert.doesNotThrow(() => assertCertificationDates(d('2026-10-07'), d('2026-10-07'), today));
  });
  test('strict parsing; status never accepted from client', () => {
    assert.equal(certificationCreateSchema.safeParse({ certification: 'A', certificateNo: '1', expiryDate: '2027-02-29' }).success, false);
    assert.equal(certificationCreateSchema.safeParse({ certification: 'A', certificateNo: '1', expiryDate: '2027-01-01T00:00:00Z' }).success, false);
    assert.equal(certificationCreateSchema.safeParse({ certification: 'A', certificateNo: '1' }).success, false);
    const upd = certificationUpdateSchema.parse({ status: 'Valid', authority: 'X' } as any);
    assert.equal((upd as any).status, undefined);
    assert.equal(certificationUpdateSchema.safeParse({ expiryDate: null }).success, false);
  });
});
