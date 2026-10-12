'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  showAlways?: boolean;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
  showAlways = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (!showAlways && totalItems <= pageSize) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-zinc-100 text-xs text-zinc-500 font-sans ${className}`}>
      <div className="font-mono text-[11px] text-zinc-500">
        Showing <span className="font-bold text-zinc-800">{startItem}</span>–<span className="font-bold text-zinc-800">{endItem}</span> of <span className="font-bold text-zinc-800">{totalItems}</span> records
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 transition-colors shadow-2xs"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200/60 font-mono text-[11px] font-bold text-zinc-800">
          {currentPage} / {totalPages}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 transition-colors shadow-2xs"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
