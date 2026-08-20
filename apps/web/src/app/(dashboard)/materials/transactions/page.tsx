import React from 'react';
import Link from 'next/link';

export default function MaterialTransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/materials" className="text-xs text-amber-700 hover:underline">← Back to Materials</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Stock Transactions History</h1>
      </div>

      <div className="p-6 rounded-xl bg-white border border-zinc-200">
        <h3 className="text-lg font-semibold mb-4">Stock Ledger Logs</h3>
        <div className="divide-y divide-zinc-100 text-sm">
          <div className="py-3 flex justify-between font-medium text-zinc-500">
            <span>Transaction ID</span>
            <span>Type</span>
            <span>Venture</span>
            <span>Quantity</span>
            <span>Date & Time</span>
          </div>
          <div className="py-4 flex justify-between items-center">
            <span className="font-mono text-xs">TX-9021</span>
            <span className="text-emerald-400 font-semibold">STOCK_IN</span>
            <span>Venture Heights Phase 1</span>
            <span>+100 Bags</span>
            <span className="text-zinc-500">Aug 10, 2026 03:21 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
