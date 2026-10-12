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
  const displayedActivities = (activities || []).slice(0, 4);

  return (
    <div className={`bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between h-full ${colSpanClass}`}>
      <div>
        <h2 className="font-extrabold text-black mb-0.5">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mb-4">{subtitle}</p>}

        <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
          {displayedActivities.length === 0 ? (
            <p className="text-xs text-zinc-400 pl-6 py-3">No recent activities.</p>
          ) : (
            displayedActivities.map((act, i) => (
              <div key={i} className="flex items-start justify-between gap-2 pl-6 relative">
                <span className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-amber-600 bg-white"></span>
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-semibold text-black truncate" title={act.t}>{act.t}</p>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono whitespace-nowrap text-right shrink-0">{act.ts}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
