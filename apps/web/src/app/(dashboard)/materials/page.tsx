import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';

export const revalidate = 0;

export default async function MaterialsPage() {
  let dbMaterials: any[] = [];
  try {
    dbMaterials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        unitOfMeasure: true,
      },
    });
  } catch (err) {
    console.error('Failed to fetch materials from DB:', err);
  }

  const materials = dbMaterials.length > 0
    ? dbMaterials.map((m: any) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        category: m.category?.name || 'General',
        uom: m.unitOfMeasure?.name || 'Units',
      }))
    : [
        { id: 'MAT-001', name: 'Cement — OPC 53 Grade', code: 'CEM-OPC53', category: 'Cement', uom: 'Bags (50kg)' },
        { id: 'MAT-002', name: 'Steel — TMT Bars 12mm', code: 'STL-TMT12', category: 'Steel', uom: 'MT' },
        { id: 'MAT-003', name: 'Steel — TMT Bars 16mm', code: 'STL-TMT16', category: 'Steel', uom: 'MT' },
        { id: 'MAT-004', name: 'River Sand', code: 'SND-RIV01', category: 'Sand', uom: 'Cu.m' },
        { id: 'MAT-005', name: 'Red Clay Bricks', code: 'BRK-CLY01', category: 'Bricks', uom: 'Nos (thousand)' },
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Material Inventory</h1>
          <p className="text-xs text-zinc-500 mt-1">Master catalog, stock balances, and item specifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/materials/requests"
            className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-semibold text-black bg-white hover:bg-zinc-100 transition-colors"
          >
            Requests Queue
          </Link>
          <Link
            href="/materials/new"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-md shadow-black/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            <span>Add Material</span>
          </Link>
        </div>
      </div>

      {/* Materials Table Card */}
      <div className="bg-white rounded-[24px] border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Master Materials Catalog</h3>
          <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
            <Link href="/materials/stock" className="hover:text-black transition-colors">Stock Balances</Link>
            <span>·</span>
            <Link href="/materials/transactions" className="hover:text-black transition-colors">Transaction Logs</Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-6 font-semibold">Material Name</th>
                <th className="py-3 px-6 font-semibold">SKU / Code</th>
                <th className="py-3 px-6 font-semibold">Category</th>
                <th className="py-3 px-6 font-semibold">Unit of Measure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {materials.map((m: any) => (
                <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-black">{m.name}</td>
                  <td className="py-3.5 px-6 font-mono text-zinc-500">{m.code}</td>
                  <td className="py-3.5 px-6">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">
                      {m.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-zinc-600 font-medium">{m.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

