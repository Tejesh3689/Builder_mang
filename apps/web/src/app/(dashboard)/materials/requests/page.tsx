import React from 'react';
import Link from 'next/link';

export default function MaterialRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/materials" className="text-xs text-indigo-400 hover:underline">← Back to Materials</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Material Requests</h1>
      </div>

      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Request Inbox</h3>
        <div className="divide-y divide-slate-800 text-sm">
          <div className="py-3 flex justify-between font-medium text-slate-400">
            <span>Request ID</span>
            <span>Venture</span>
            <span>Items Requested</span>
            <span>Status</span>
          </div>
          <div className="py-4 flex justify-between items-center">
            <span className="font-mono text-xs">REQ-001</span>
            <span>Venture Heights Phase 1</span>
            <span>OPC Cement - 100 Bags</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
