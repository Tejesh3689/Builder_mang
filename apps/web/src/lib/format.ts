export type CurrencyCode = 'INR' | 'USD' | 'AED';

export function formatCurrency(
  val: number | null | undefined,
  compact: boolean = false,
  currency: CurrencyCode = 'INR'
): string {
  if (val === null || val === undefined || isNaN(val)) return '—';

  const localeMap: Record<CurrencyCode, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    AED: 'en-AE',
  };

  const locale = localeMap[currency] || 'en-IN';

  if (compact && currency === 'INR') {
    if (Math.abs(val) >= 10_000_000) {
      return `₹${(val / 10_000_000).toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    if (Math.abs(val) >= 100_000) {
      return `₹${(val / 100_000).toFixed(2).replace(/\.00$/, '')} L`;
    }
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: compact ? 0 : 2,
  }).format(val);
}

export function formatDate(
  date: Date | string | number | null | undefined,
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY',
  timeZone: string = 'Asia/Kolkata'
): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value || '';
  const m = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';

  if (format === 'MM/DD/YYYY') return `${m}/${day}/${y}`;
  if (format === 'YYYY-MM-DD') return `${y}-${m}-${day}`;
  return `${day}/${m}/${y}`;
}
