'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface LedgerTx {
  id: string;
  txNumber: string;
  type: string;
  materialName: string;
  uom: string;
  ventureName: string;
  quantity: string;
  date: string;
  performedBy: string;
}

interface MaterialTransactionsClientProps {
  transactions: LedgerTx[];
}

export default function MaterialTransactionsClient({ transactions }: MaterialTransactionsClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalItems = transactions.length;
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 w-full text-sm">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="space-y-1">
          <Link href="/materials" className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-semibold">
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
          <span className="text-xs text-zinc-400 font-mono">
            {totalItems} total transactions
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full table-auto text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-5 font-semibold whitespace-nowrap">Tx Number & Type</th>
                <th className="py-3 px-5 font-semibold">Material</th>
                <th className="py-3 px-5 font-semibold">Venture Project</th>
                <th className="py-3 px-5 font-semibold text-center whitespace-nowrap">Quantity Delta</th>
                <th className="py-3 px-5 font-semibold whitespace-nowrap">Authorized By</th>
                <th className="py-3 px-5 font-semibold text-right whitespace-nowrap">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedTransactions.map((tx) => {
                const isPositive = tx.quantity.startsWith('+');
                return (
                  <tr key={tx.id} className="hover:bg-zinc-50/20 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-mono font-bold text-zinc-900">{tx.txNumber}</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-medium text-black">
                      {tx.materialName}
                    </td>
                    <td className="py-3 px-5 text-zinc-500 font-medium max-w-[140px] truncate" title={tx.ventureName}>
                      {tx.ventureName}
                    </td>
                    <td className={`py-3 px-5 text-center font-extrabold text-sm whitespace-nowrap ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.quantity} {tx.uom}
                    </td>
                    <td className="py-3 px-5 text-zinc-700 font-medium whitespace-nowrap">
                      {tx.performedBy}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-[10px] text-zinc-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                  </tr>
                );
              })}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-400 text-xs">No ledger transaction logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          showAlways={true}
        />
      </div>
    </div>
  );
}
