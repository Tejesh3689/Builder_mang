import React from 'react';

const mockInventory = [
  { id: 'INV-101', item: 'Portland Cement (50kg)', category: 'Materials', stock: 450, reorder: 200, status: 'In Stock' },
  { id: 'INV-102', item: 'Steel Rebar (12mm)', category: 'Materials', stock: 120, reorder: 150, status: 'Low Stock' },
  { id: 'INV-103', item: 'Safety Helmets', category: 'Equipment', stock: 85, reorder: 50, status: 'In Stock' },
  { id: 'INV-104', item: 'Excavator Fuel (L)', category: 'Fuel', stock: 1500, reorder: 2000, status: 'Reorder Now' },
];

export default function InventoryReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Inventory Reports</h1>
        <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Export Report</button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
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
            {mockInventory.map(item => (
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
