import React from 'react';
import Link from 'next/link';

export default function StockLedgerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/materials" className="text-xs text-indigo-400 hover:underline">← Back to Materials</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Live Stock Ledger</h1>
      </div>

      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Current Stock Levels</h3>
        <div className="divide-y divide-slate-800 text-sm">
          <div className="py-3 flex justify-between font-medium text-slate-400">
            <span>Material</span>
            <span>Venture</span>
            <span>Quantity On Hand</span>
          </div>
          <div className="py-3.5 flex justify-between">
            <span>OPC Cement 53 Grade</span>
            <span>Venture Heights Phase 1</span>
            <span className="font-semibold text-emerald-400">100 Bags</span>
          </div>
        </div>
      </div>
    </div>
  );
}
