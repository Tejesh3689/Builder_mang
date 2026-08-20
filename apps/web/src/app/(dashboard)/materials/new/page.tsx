import React from 'react';
import Link from 'next/link';

export default function NewMaterialPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/materials" className="text-xs text-amber-700 hover:underline">← Back to Materials</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Add Master Material</h1>
      </div>

      <form className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Material Name</label>
          <input type="text" className="mt-1 block w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black" placeholder="e.g. Steel Rebar" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Material Code</label>
          <input type="text" className="mt-1 block w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black" placeholder="e.g. MAT-STL" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Unit of Measure</label>
          <select className="mt-1 block w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black">
            <option>Bags</option>
            <option>Kg</option>
            <option>Liters</option>
            <option>Meters</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors">
          Save Material
        </button>
      </form>
    </div>
  );
}
