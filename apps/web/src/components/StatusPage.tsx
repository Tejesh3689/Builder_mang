import React from 'react';
import Link from 'next/link';

/** Shared body for the 404 and error pages. */
export function StatusPage({
  code,
  title,
  message,
  action,
}: {
  code: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <p className="text-[11px] font-extrabold text-[#d97706] tracking-[0.25em] uppercase font-mono">{code}</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {action}
        <Link
          href="/dashboard"
          className="px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
