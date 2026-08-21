import React from 'react';
import Link from 'next/link';

export default function MaterialTransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/materials" className="text-xs text-amber-700 hover:underline">← Back to Materials</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Stock Transactions History</h1>
      </div>

      <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
        <h3 className="text-lg font-semibold px-6 py-4 border-b border-zinc-100">Stock Ledger Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 font-medium text-zinc-500">
                <th className="py-3 px-6 font-medium">Transaction ID</th>
                <th className="py-3 px-6 font-medium">Type</th>
                <th className="py-3 px-6 font-medium">Venture</th>
                <th className="py-3 px-6 font-medium">Quantity</th>
                <th className="py-3 px-6 font-medium">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="py-4 px-6 font-mono text-xs">TX-9021</td>
                <td className="py-4 px-6 text-emerald-400 font-semibold">STOCK_IN</td>
                <td className="py-4 px-6">Venture Heights Phase 1</td>
                <td className="py-4 px-6">+100 Bags</td>
                <td className="py-4 px-6 text-zinc-500">Aug 10, 2026 03:21 PM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
