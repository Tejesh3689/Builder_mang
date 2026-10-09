export function formatCurrency(val: number | null | undefined, compact: boolean = false): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  
  if (compact) {
    if (Math.abs(val) >= 1_000_0000) {
      return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    if (Math.abs(val) >= 1_00_000) {
      return `₹${(val / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    }
    // Fall back to compact standard if small
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
