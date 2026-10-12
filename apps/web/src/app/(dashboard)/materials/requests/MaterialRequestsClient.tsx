'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

interface MaterialReqItem {
  id: string;
  reqNumber: string;
  ventureName: string;
  items: string;
  status: string;
  requestedBy: string;
  date: string;
}

export default function MaterialRequestsClient({ requests }: { requests: MaterialReqItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.reqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ventureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ISSUED':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-700 border border-amber-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-2xs w-full sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by ticket #, venture, material, requester..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs w-full text-zinc-800 placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full table-auto text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-6 font-semibold whitespace-nowrap">Request ID</th>
                <th className="py-3 px-6 font-semibold whitespace-nowrap">Project Venture</th>
                <th className="py-3 px-6 font-semibold">Items Requested</th>
                <th className="py-3 px-6 font-semibold whitespace-nowrap">Requested By</th>
                <th className="py-3 px-6 font-semibold whitespace-nowrap">Date Submitted</th>
                <th className="py-3 px-6 font-semibold text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/40 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-black whitespace-nowrap">{r.reqNumber}</td>
                  <td className="py-3.5 px-6 font-bold text-zinc-800 whitespace-nowrap">{r.ventureName}</td>
                  <td className="py-3.5 px-6 text-zinc-900 font-medium max-w-xs truncate" title={r.items}>{r.items}</td>
                  <td className="py-3.5 px-6 text-zinc-600 font-medium whitespace-nowrap">{r.requestedBy}</td>
                  <td className="py-3.5 px-6 text-zinc-500 font-mono text-[11px] whitespace-nowrap">{r.date}</td>
                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(r.status)}`}>
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-400 text-xs">
                    No material request tickets matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
