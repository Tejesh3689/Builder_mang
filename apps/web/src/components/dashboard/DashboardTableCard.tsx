import React from 'react';
import Link from 'next/link';

interface DashboardTableCardProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  headers: string[];
  children: React.ReactNode;
  colSpanClass?: string;
  footer?: React.ReactNode;
}

export default function DashboardTableCard({ 
  title, 
  subtitle, 
  viewAllLink, 
  headers, 
  children,
  colSpanClass = "",
  footer
}: DashboardTableCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between ${colSpanClass}`}>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-extrabold text-black">{title}</h2>
              {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
            </div>
            {viewAllLink && (
              <Link href={viewAllLink} className="text-xs font-semibold text-zinc-600 hover:text-black transition-colors">
                View all &rarr;
              </Link>
            )}
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-xs table-auto">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 uppercase font-mono text-[10px]">
                  {headers.map((h, i) => (
                    <th key={i} className={`pb-2.5 ${i === headers.length - 1 ? 'pr-0' : 'pr-2 sm:pr-2.5'} whitespace-nowrap tracking-wider font-semibold`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {children}
              </tbody>
            </table>
          </div>
        </div>
        {footer && <div className="mt-3 pt-2 border-t border-zinc-100">{footer}</div>}
      </div>
    </div>
  );
}
