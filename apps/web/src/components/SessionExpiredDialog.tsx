'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SESSION_EXPIRED_EVENT } from '@/lib/api';

/**
 * Shown when any API call returns 401. Signing in from a new tab keeps whatever the user
 * typed on this page; once a session exists again (checked when the tab regains focus)
 * the dialog closes and the user can simply retry.
 */
export default function SessionExpiredDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, show);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const recheck = async () => {
      try {
        const res = await fetch('/api/auth/session', { headers: { Accept: 'application/json' } });
        const session = await res.json();
        if (session?.user) setOpen(false);
      } catch {
        // still signed out / offline: keep the dialog
      }
    };
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [open]);

  if (!open) return null;

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname || '/dashboard')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-4" role="alertdialog" aria-modal="true" aria-labelledby="session-expired-title">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-lg border border-zinc-200 p-6 max-w-sm w-full space-y-4">
        <h3 id="session-expired-title" className="text-base font-extrabold text-black tracking-tight">Your session has expired</h3>
        <p className="text-xs text-zinc-600">
          Nothing was saved from your last action. Anything you typed on this page is still here.
          Sign in again in a new tab, then come back and try again.
        </p>
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <button
            onClick={() => { window.location.href = loginUrl; }}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors text-xs"
          >
            Sign in here (discard changes)
          </button>
          <button
            onClick={() => window.open('/login', '_blank', 'noopener')}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white font-bold rounded-lg transition-colors text-xs"
          >
            Sign in in a new tab
          </button>
        </div>
      </div>
    </div>
  );
}
