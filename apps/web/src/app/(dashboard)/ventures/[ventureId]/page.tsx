import React from 'react';
import Link from 'next/link';

export default async function VentureDetailPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const resolvedParams = await params;
  const vId = resolvedParams?.ventureId || 'VEN-A';
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/ventures" className="text-xs text-indigo-400 hover:underline">← Back to Ventures</Link>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Venture: {vId.toUpperCase()}</h1>
        </div>
      </div>
      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h3 className="text-lg font-semibold">Active Inventory</h3>
        <p className="text-sm text-slate-400">Current material volumes reserved at site.</p>
        <div className="divide-y divide-slate-800">
          <div className="py-2.5 flex justify-between">
            <span>OPC Cement 53 Grade</span>
            <span className="font-semibold text-indigo-400">100 Bags</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span>TMT Steel Rebars 12mm</span>
            <span className="font-semibold text-indigo-400">1500 Kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
