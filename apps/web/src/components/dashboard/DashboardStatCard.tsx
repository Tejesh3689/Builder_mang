import React from 'react';
import Link from 'next/link';

interface StatItem {
  label: string;
  count: number | string;
  statusKey?: string;
  tone?: { bg: string; text: string; dot: string };
}

interface DashboardStatCardProps {
  title: string;
  items: StatItem[];
}

export default function DashboardStatCard({ title, items }: DashboardStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between">
      <div className="space-y-3.5">
        <h2 className="font-extrabold text-black mb-2">{title}</h2>
        {items.map((st, idx) => {
          const tone = st.tone || { bg: 'bg-zinc-100 border-zinc-200', text: 'text-zinc-700', dot: 'bg-zinc-500' };
          return (
            <div key={idx} className="flex items-center justify-between p-2 rounded-xl">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${tone.bg} ${tone.text}`}>
                <span className={`w-2 h-2 rounded-full ${tone.dot}`}></span>
                <span>{st.label}</span>
              </span>
              <span className="font-mono font-bold text-base text-black">{st.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
