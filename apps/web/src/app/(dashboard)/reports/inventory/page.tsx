import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';

export default async function InventoryReportsPage() {
  await requireAuth();

  const materials = await prisma.material.findMany({
    include: {
      category: true,
      stocks: true,
    },
    orderBy: { name: 'asc' }
  });

  const inventory = materials.map(mat => {
    const totalStock = mat.stocks.reduce((acc, stock) => acc + stock.physicalQuantity, 0);
    const status = totalStock <= 0 ? 'Out of Stock' : (totalStock <= mat.reorderLevel ? 'Low Stock' : 'In Stock');
    
    return {
      id: mat.code,
      item: mat.name,
      category: mat.category?.name || 'Uncategorized',
      stock: totalStock,
      reorder: mat.reorderLevel,
      status
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Inventory Reports</h1>
        <Link href="/reports/inventory/export" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start">Export Report</Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Stock Level</th>
                <th className="px-6 py-4 font-medium">Reorder Point</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{item.id}</td>
                  <td className="px-6 py-4">{item.item}</td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4">{item.stock}</td>
                  <td className="px-6 py-4">{item.reorder}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>{item.status}</span>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
