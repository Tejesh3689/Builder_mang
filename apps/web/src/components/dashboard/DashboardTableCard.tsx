import React from 'react';
import Link from 'next/link';

interface DashboardTableCardProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  headers: string[];
  children: React.ReactNode;
  colSpanClass?: string;
}

export default function DashboardTableCard({ 
  title, 
  subtitle, 
  viewAllLink, 
  headers, 
  children,
  colSpanClass = ""
}: DashboardTableCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between ${colSpanClass}`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-extrabold text-black">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link href={viewAllLink} className="text-xs font-semibold text-zinc-600 hover:text-black">
              View all &rarr;
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 uppercase font-mono text-[10px]">
                {headers.map((h, i) => (
                  <th key={i} className="pb-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {children}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
