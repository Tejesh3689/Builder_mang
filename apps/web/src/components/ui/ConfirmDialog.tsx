'use client';

import React from 'react';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const titleId = 'confirm-dialog-title';

  const confirmBtnStyles =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-zinc-900 hover:bg-black text-white';

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-xl p-6 space-y-4">
      <div>
        <h3 id={titleId} className="text-base font-bold text-black">
          {title}
        </h3>
        <div className="mt-2 text-xs text-zinc-600 leading-relaxed">
          {description}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 text-xs font-semibold">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold shadow-xs transition-colors disabled:opacity-50 ${confirmBtnStyles}`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Dialog>
  );
}
