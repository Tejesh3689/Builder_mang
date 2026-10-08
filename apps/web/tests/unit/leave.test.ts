import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { leaveDurationDays, toCalendarDate, LeaveRequestSchema, MAX_LEAVE_DAYS } from '@builder/validation';
import { isTransientPrismaError } from '@/lib/transaction';

describe('leaveDurationDays (LVE-02)', () => {
  test('same calendar day, start to end of day = 1', () => {
    assert.equal(leaveDurationDays('2026-11-10T00:00:00+05:30', '2026-11-10T23:59:59.999+05:30'), 1);
  });
  test('09:00 to 18:00 next day = 2', () => {
    assert.equal(leaveDurationDays('2026-11-10T09:00:00+05:30', '2026-11-11T18:00:00+05:30'), 2);
  });
  test('year boundary Dec 31 -> Jan 2 = 3', () => {
    assert.equal(leaveDurationDays('2026-12-31T00:00:00+05:30', '2027-01-02T00:00:00+05:30'), 3);
  });
  test('Feb 28 -> Mar 1 in non-leap and leap years', () => {
    assert.equal(leaveDurationDays('2027-02-28T10:00:00+05:30', '2027-03-01T10:00:00+05:30'), 2);
    assert.equal(leaveDurationDays('2028-02-28T10:00:00+05:30', '2028-03-01T10:00:00+05:30'), 3);
  });
  test('uses business (IST) calendar dates, not UTC', () => {
    // 00:00 IST is 18:30 UTC the previous day
    assert.equal(toCalendarDate('2026-11-10T00:00:00+05:30'), '2026-11-10');
    assert.equal(leaveDurationDays('2026-11-10T00:00:00+05:30', '2026-11-10T00:00:00+05:30'), 1);
  });
});

describe('LeaveRequestSchema (LVE-02)', () => {
  const base = { employeeId: '00000000-0000-4000-8000-000000000000', type: 'CASUAL' as const };
  const days = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

  test('accepts a near-future range', () => {
    assert.equal(LeaveRequestSchema.safeParse({ ...base, startDate: days(2), endDate: days(3) }).success, true);
  });
  test('rejects start dates in the past', () => {
    assert.equal(LeaveRequestSchema.safeParse({ ...base, startDate: days(-1), endDate: days(1) }).success, false);
    assert.equal(LeaveRequestSchema.safeParse({ ...base, startDate: days(-365), endDate: days(-364) }).success, false);
  });
  test(`rejects ranges over ${MAX_LEAVE_DAYS} days`, () => {
    assert.equal(LeaveRequestSchema.safeParse({ ...base, startDate: days(1), endDate: days(400) }).success, false);
  });
});

describe('isTransientPrismaError', () => {
  test('retries contention codes only', () => {
    for (const code of ['P2034', 'P2028', 'P2024']) assert.equal(isTransientPrismaError({ code }), true);
    for (const code of ['P2002', 'P2025', undefined]) assert.equal(isTransientPrismaError({ code }), false);
  });
});
