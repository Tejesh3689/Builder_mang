import React from 'react';
import Link from 'next/link';

export default function MaterialRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/materials" className="text-xs text-amber-700 hover:underline">← Back to Materials</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Material Requests</h1>
      </div>

      <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
        <h3 className="text-lg font-semibold px-6 py-4 border-b border-zinc-100">Request Inbox</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 font-medium text-zinc-500">
                <th className="py-3 px-6 font-medium">Request ID</th>
                <th className="py-3 px-6 font-medium">Venture</th>
                <th className="py-3 px-6 font-medium">Items Requested</th>
                <th className="py-3 px-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="py-4 px-6 font-mono text-xs">REQ-001</td>
                <td className="py-4 px-6">Venture Heights Phase 1</td>
                <td className="py-4 px-6">OPC Cement - 100 Bags</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400">Pending</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
