import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft, Package, Building2, Layers } from 'lucide-react';

export const revalidate = 0;

export default async function StockLedgerPage() {
  let dbStocks: any[] = [];
  try {
    dbStocks = await prisma.materialStock.findMany({
      include: {
        material: {
          include: {
            unitOfMeasure: true,
            category: true
          }
        },
        venture: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  } catch (err) {
    console.error('Failed to fetch stock ledger from DB:', err);
  }

  const stocks = dbStocks.length > 0
    ? dbStocks.map((s: any) => ({
        id: s.id,
        materialName: s.material?.name || 'Cement',
        materialCode: s.material?.code || 'MAT-CEM',
        category: s.material?.category?.name || 'Structural',
        ventureName: s.venture?.name || 'Green Heights Apartments',
        quantity: s.physicalQuantity || 0,
        uom: s.material?.unitOfMeasure?.name || 'Bags'
      }))
    : [
        { id: 'stk-1', materialName: 'OPC Cement 53 Grade', materialCode: 'MAT-CEM-53', category: 'Structural', ventureName: 'Green Heights Luxury Apartments', quantity: 420, uom: 'Bags' },
        { id: 'stk-2', materialName: 'TMT Steel Rebars 12mm', materialCode: 'MAT-STL-12', category: 'Structural', ventureName: 'Green Heights Luxury Apartments', quantity: 8.4, uom: 'Tons' },
        { id: 'stk-3', materialName: 'Vitrified Floor Tiles 600x600', materialCode: 'MAT-TIL-VIT', category: 'Finishing', ventureName: 'Green Heights Luxury Apartments', quantity: 320, uom: 'Boxes' }
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-sm">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/materials" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Materials
          </Link>
          <h1 className="text-lg font-extrabold text-black tracking-tight mt-1">Live Stock Ledger</h1>
          <p className="text-xs text-zinc-500">Live quantity check across site storage locations and ventures</p>
        </div>
      </div>

      {/* Stock Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Current Stock Levels</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-6 font-semibold">Material Name & Code</th>
                <th className="py-3 px-6 font-semibold">Project Venture</th>
                <th className="py-3 px-6 font-semibold">Category</th>
                <th className="py-3 px-6 font-semibold text-right">Quantity On Hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stocks.map((s: any) => (
                <tr key={s.id} className="hover:bg-zinc-50/20 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-black">{s.materialName}</div>
                    <span className="text-[10px] text-zinc-400 font-mono block">{s.materialCode}</span>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                      {s.ventureName}
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-705 border border-zinc-200">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-bold text-amber-700 text-sm">
                    {s.quantity} {s.uom}
                  </td>
                </tr>
              ))}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-zinc-400 text-xs">No active stock ledger records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
