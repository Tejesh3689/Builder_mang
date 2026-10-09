import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft, Building2 } from 'lucide-react';

export const revalidate = 0;

export default async function InventoryAlertsPage() {
  let dbStocks: any[] = [];
  try {
    // Get all materials and stock to find low ones
    // Low stock: Physical quantity < Reorder Level
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
    console.error('Failed to fetch stock for alerts:', err);
  }

  const stocks = dbStocks
    .filter((s: any) => s.physicalQuantity <= (s.material?.reorderLevel || 50))
    .map((s: any) => ({
      id: s.id,
      materialName: s.material?.name || 'Material',
      materialCode: s.material?.code || 'MAT-XXX',
      category: s.material?.category?.name || 'Category',
      ventureName: s.venture?.name || 'Main Warehouse',
      quantity: s.physicalQuantity || 0,
      reorderLevel: s.material?.reorderLevel || 50,
      uom: s.material?.unitOfMeasure?.name || 'Bags'
    }));

  return (
    <div className="space-y-6 w-full text-sm">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="space-y-1">
          <Link href="/materials" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory Overview
          </Link>
          <h1 className="text-lg font-extrabold text-black tracking-tight mt-1">Inventory Alerts</h1>
          <p className="text-xs text-zinc-500">Materials below reorder threshold requiring immediate attention.</p>
        </div>
      </div>

      {/* Stock Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-red-600 uppercase tracking-wider font-mono">Critical & Low Stock Levels</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-6 font-semibold">Material Name & Code</th>
                <th className="py-3 px-6 font-semibold">Location</th>
                <th className="py-3 px-6 font-semibold">Category</th>
                <th className="py-3 px-6 font-semibold text-right">Qty / Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stocks.map((s: any) => {
                const isCritical = s.quantity <= (s.reorderLevel / 2);
                return (
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
                    <td className="py-3.5 px-6 text-right font-bold text-sm">
                      <span className={isCritical ? 'text-red-600' : 'text-amber-600'}>
                        {s.quantity}
                      </span>
                      <span className="text-zinc-400 text-xs font-normal"> / {s.reorderLevel} {s.uom}</span>
                    </td>
                  </tr>
                );
              })}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-zinc-400 text-xs">All stock levels are optimal. No alerts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
