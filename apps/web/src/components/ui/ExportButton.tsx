'use client';

import React, { useState } from 'react';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { api } from '@/lib/api';

type ExportButtonProps = {
  module: 'ventures' | 'transactions' | 'project-report' | 'employee-report' | 'inventory-report';
  query?: URLSearchParams;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function ExportButton({ module, query, disabled, className, label }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setLoading(true);
    setErrorToast(null);
    try {
      const q = query ? new URLSearchParams(query) : new URLSearchParams();
      q.set('format', format);

      // Using fetch directly because we need a Blob response and our api.get expects JSON.
      const response = await fetch(`/api/export/${module}?${q.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const text = await response.text();
        let message = 'Export failed';
        try {
          const json = JSON.parse(text);
          message = json.error || message;
        } catch {}
        setErrorToast(message);
        return;
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        setErrorToast('Nothing to export');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `export.${format}`;
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorToast(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => handleExport('xlsx')}
        className={className || "px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
        {label || 'Export Data'}
      </button>
      
      {errorToast && (
        <div className="absolute top-full mt-2 right-0 z-50 w-max max-w-xs p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2">
          {errorToast}
          <button onClick={() => setErrorToast(null)} className="ml-2 font-bold hover:underline">Dismiss</button>
        </div>
      )}
    </div>
  );
}
