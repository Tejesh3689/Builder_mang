import React from 'react';
import Link from 'next/link';
import { Plus, CheckCircle, FileText, Package } from 'lucide-react';

interface ActionItem {
  label: string;
  icon: string;
  href: string;
  color: string;
}

interface DashboardQuickActionsProps {
  title: string;
  actions: ActionItem[];
  colSpanClass?: string;
}

export default function DashboardQuickActions({ title, actions, colSpanClass = "" }: DashboardQuickActionsProps) {
  const getIcon = (name: string) => {
    switch(name) {
      case 'check': return <CheckCircle className="w-5 h-5" />;
      case 'file': return <FileText className="w-5 h-5" />;
      case 'package': return <Package className="w-5 h-5" />;
      default: return <Plus className="w-5 h-5" />;
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between ${colSpanClass}`}>
      <div>
        <h2 className="font-extrabold text-black mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((act, i) => (
            <Link key={i} href={act.href} className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-200 transition-all text-center gap-2">
              <span className={act.color}>{getIcon(act.icon)}</span>
              <span className="text-xs font-bold text-zinc-700">{act.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
