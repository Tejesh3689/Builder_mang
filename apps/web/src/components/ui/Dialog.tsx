'use client';

import React from 'react';
import { useModalA11y } from './useModalA11y';

/**
 * Accessible modal shell: dimmed overlay, role="dialog" + aria-modal, focus trap, Escape and
 * backdrop-click to close, focus returned to the trigger on close.
 * `labelledBy` must be the id of the dialog's heading.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  className = 'w-full max-w-md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useModalA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={className}>
        {children}
      </div>
    </div>
  );
}
