import React from 'react';

interface ActivityItem {
  t: string;
  ts: string;
}

interface DashboardActivityFeedProps {
  title: string;
  subtitle?: string;
  activities: ActivityItem[];
  colSpanClass?: string;
}

export default function DashboardActivityFeed({ title, subtitle, activities, colSpanClass = "" }: DashboardActivityFeedProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm ${colSpanClass}`}>
      <h2 className="font-extrabold text-black mb-0.5">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-500 mb-4">{subtitle}</p>}

      <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
        {activities.map((act, i) => (
          <div key={i} className="flex items-start gap-3 pl-6 relative">
            <span className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-amber-600 bg-white"></span>
            <div>
              <p className="text-xs font-semibold text-black">{act.t}</p>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{act.ts}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
