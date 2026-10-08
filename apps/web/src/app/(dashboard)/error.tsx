'use client';

import { useEffect } from 'react';
import { StatusPage } from '@/components/StatusPage';

/** Catches render/data errors inside the dashboard so a failure never leaves a blank or stuck screen. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[dashboard] render error', error);
  }, [error]);

  return (
    <StatusPage
      code="Something went wrong"
      title="This page couldn't be loaded"
      message="An unexpected error occurred while loading this page. Your data is safe. Try again, or come back in a moment."
      action={
        <button
          onClick={reset}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold"
        >
          Try again
        </button>
      }
    />
  );
}
