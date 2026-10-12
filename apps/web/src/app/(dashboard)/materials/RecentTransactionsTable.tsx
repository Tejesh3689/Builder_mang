'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface TransactionItem {
  id: string;
  date: string;
  type: string;
  qty: string;
  uom: string;
  fromTo: string;
  by: string;
  ref: string;
}

interface RecentTransactionsTableProps {
  transactions: TransactionItem[];
}

export default function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalItems = transactions.length;
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getTxTypeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('RECEIPT')) return { label: 'Received', cls: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' };
    if (t.includes('ISSUE')) return { label: 'Issued', cls: 'bg-amber-500/10 text-amber-700 border border-amber-500/20' };
    if (t.includes('TRANSFER')) return { label: 'Transferred', cls: 'bg-blue-500/10 text-blue-600 border border-blue-500/20' };
    return { label: 'Adjusted', cls: 'bg-zinc-500/10 text-zinc-600 border border-zinc-400/20' };
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex justify-between items-center">
        <h3 className="font-bold text-sm text-black">Recent Transactions</h3>
        <Link href="/materials/transactions" className="text-[11px] text-amber-700 hover:underline font-semibold flex items-center gap-0.5">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-xs text-left table-auto">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
              <th className="py-2.5 px-2 xl:px-3 font-semibold whitespace-nowrap">Date</th>
              <th className="py-2.5 px-2 xl:px-3 font-semibold whitespace-nowrap">Type</th>
              <th className="py-2.5 px-2 xl:px-3 font-semibold whitespace-nowrap">Qty</th>
              <th className="py-2.5 px-2 xl:px-3 font-semibold">From → To</th>
              <th className="py-2.5 px-2 xl:px-3 font-semibold whitespace-nowrap">By</th>
              <th className="py-2.5 px-2 xl:px-3 font-semibold text-right whitespace-nowrap">Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paginatedTransactions.map((tx) => {
              const { label, cls } = getTxTypeStyle(tx.type);
              return (
                <tr key={tx.id} className="hover:bg-zinc-50/30 transition-colors">
                  <td className="py-2.5 px-2 xl:px-3 font-mono text-zinc-500 whitespace-nowrap text-[10px] xl:text-[11px]" title={tx.date}>
                    {tx.date}
                  </td>
                  <td className="py-2.5 px-2 xl:px-3 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${cls}`}>{label}</span>
                  </td>
                  <td className={`py-2.5 px-2 xl:px-3 font-extrabold whitespace-nowrap text-xs ${tx.qty?.startsWith('+') ? 'text-emerald-500' : 'text-amber-700'}`}>
                    {tx.qty} <span className="text-zinc-400 font-normal text-[10px]">{tx.uom}</span>
                  </td>
                  <td className="py-2.5 px-2 xl:px-3 text-zinc-600 max-w-[100px] xl:max-w-[140px] truncate" title={tx.fromTo}>
                    {tx.fromTo}
                  </td>
                  <td className="py-2.5 px-2 xl:px-3 text-zinc-700 font-medium whitespace-nowrap max-w-[75px] xl:max-w-[95px] truncate" title={tx.by}>
                    {tx.by}
                  </td>
                  <td className="py-2.5 px-2 xl:px-3 text-right whitespace-nowrap">
                    <span className="font-mono text-zinc-400 text-[10px] max-w-[85px] xl:max-w-[105px] truncate block ml-auto" title={tx.ref}>
                      {tx.ref}
                    </span>
                  </td>
                </tr>
              );
            })}
            {paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                  No recent transactions recorded.
                </td>
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
  );
}
