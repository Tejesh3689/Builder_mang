// Single source of truth for leave-duration math. Used by leave approval (balance deduction)
// and the team reports screen so both always show the same number.

// Leave days are counted as calendar dates in the business timezone, not raw 24h spans:
// 09:00 Mon -> 18:00 Tue is 2 days, 00:00 -> 23:59 the same day is 1 day.
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

// Upper bound on a single request (covers 26-week maternity leave); anything longer is treated as a typo.
export const MAX_LEAVE_DAYS = 182;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Calendar date (YYYY-MM-DD) of an instant in the given timezone. */
export function toCalendarDate(date: Date | string, timeZone: string = BUSINESS_TIMEZONE): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}

function calendarDateToUtcMs(calendarDate: string) {
  const [y, m, d] = calendarDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Inclusive number of calendar days covered by [start, end]. Returns 0 if end is before start. */
export function leaveDurationDays(start: Date | string, end: Date | string, timeZone: string = BUSINESS_TIMEZONE): number {
  const diff = calendarDateToUtcMs(toCalendarDate(end, timeZone)) - calendarDateToUtcMs(toCalendarDate(start, timeZone));
  return diff < 0 ? 0 : Math.round(diff / MS_PER_DAY) + 1;
}
