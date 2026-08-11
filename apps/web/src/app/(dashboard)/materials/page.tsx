import React from 'react';
import Link from 'next/link';

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Material Management</h1>
        <div className="flex space-x-2">
          <Link href="/materials/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors">
            + Add Master Material
          </Link>
          <Link href="/materials/requests" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold border border-slate-700 transition-colors">
            Requests
          </Link>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Material Master List</h3>
          <div className="flex space-x-3 text-xs text-indigo-400">
            <Link href="/materials/stock" className="hover:underline">View Live Stock</Link>
            <span>•</span>
            <Link href="/materials/transactions" className="hover:underline">Transaction History</Link>
          </div>
        </div>

        <div className="divide-y divide-slate-800 text-sm">
          <div className="py-3 flex justify-between font-medium text-slate-400">
            <span>Material Name</span>
            <span>Code</span>
            <span>UOM</span>
          </div>
          <div className="py-3.5 flex justify-between">
            <span>OPC Cement 53 Grade</span>
            <span className="font-mono text-xs">MAT-CEM</span>
            <span>Bags</span>
          </div>
          <div className="py-3.5 flex justify-between">
            <span>TMT Steel Rebars 12mm</span>
            <span className="font-mono text-xs">MAT-STL</span>
            <span>Kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
