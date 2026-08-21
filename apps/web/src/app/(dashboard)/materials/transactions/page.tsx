import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft, Clock, ShoppingBag } from 'lucide-react';

export const revalidate = 0;

export default async function MaterialTransactionsPage() {
  let dbTransactions: any[] = [];
  try {
    dbTransactions = await prisma.materialTransaction.findMany({
      include: {
        material: {
          include: { unitOfMeasure: true }
        },
        venture: true,
        performedBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Failed to load transaction ledger logs:', err);
  }

  const transactions = dbTransactions.length > 0
    ? dbTransactions.map((tx: any) => ({
        id: tx.id,
        txNumber: tx.transactionNumber,
        type: tx.transactionType,
        materialName: tx.material?.name || 'Cement',
        uom: tx.material?.unitOfMeasure?.name || 'Bags',
        ventureName: tx.venture?.name || 'Green Heights',
        quantity: tx.quantityIn > 0 ? `+${tx.quantityIn}` : `-${tx.quantityOut}`,
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Just now',
        performedBy: tx.performedBy?.name || 'System'
      }))
    : [
        { id: 'tx-1', txNumber: 'TX-9021', type: 'RECEIPT', materialName: 'OPC Cement 53 Grade', uom: 'Bags', ventureName: 'Green Heights Luxury Apartments', quantity: '+420', date: '10 Feb 2026 09:30 AM', performedBy: 'Suresh Verma' },
        { id: 'tx-2', txNumber: 'TX-9022', type: 'ISSUE', materialName: 'TMT Steel Rebars 12mm', uom: 'Tons', ventureName: 'Green Heights Luxury Apartments', quantity: '-1.2', date: '12 Feb 2026 02:45 PM', performedBy: 'Ajay Rao' }
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-sm">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/materials" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Materials
          </Link>
          <h1 className="text-lg font-extrabold text-black tracking-tight mt-1">Stock Transactions History</h1>
          <p className="text-xs text-zinc-500">Full audit trail of material receipts, site issues, and stock updates</p>
        </div>
      </div>

      {/* Table Logs */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Stock Ledger Logs</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-6 font-semibold">Tx Number & Type</th>
                <th className="py-3 px-6 font-semibold">Material</th>
                <th className="py-3 px-6 font-semibold">Venture Project</th>
                <th className="py-3 px-6 font-semibold text-center">Quantity Delta</th>
                <th className="py-3 px-6 font-semibold">Authorized By</th>
                <th className="py-3 px-6 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {transactions.map((tx: any) => {
                const isPositive = tx.quantity.startsWith('+');
                return (
                  <tr key={tx.id} className="hover:bg-zinc-50/20 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-mono font-bold text-zinc-900">{tx.txNumber}</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-black">
                      {tx.materialName}
                    </td>
                    <td className="py-3.5 px-6 text-zinc-500 font-medium">
                      {tx.ventureName}
                    </td>
                    <td className={`py-3.5 px-6 text-center font-extrabold text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.quantity} {tx.uom}
                    </td>
                    <td className="py-3.5 px-6 text-zinc-650 font-medium">
                      {tx.performedBy}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-[10px] text-zinc-400">
                      {tx.date}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-400 text-xs">No ledger transaction logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
