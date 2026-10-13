'use client';

import React, { useState } from 'react';
import { Select, SelectOption } from '@/components/ui/Select';
import Link from 'next/link';

export default function ExportInventoryReportPage() {
  const [category, setCategory] = useState('All Categories');
  const [format, setFormat] = useState('xlsx');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleGenerateExport = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      if (format === 'pdf') {
        window.print();
        setStatusMessage({ text: 'Print dialog opened for PDF export.', type: 'success' });
        setIsGenerating(false);
        return;
      }

      const q = new URLSearchParams();
      q.set('format', format);
      if (category && category !== 'All Categories') {
        q.set('category', category);
      }

      const response = await fetch(`/api/export/inventory-report?${q.toString()}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const text = await response.text();
        let message = 'Failed to generate inventory report export.';
        try {
          const json = JSON.parse(text);
          message = json.error || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `naprocs-inventory-report-${dateStr}.${format}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({ text: `Report exported successfully as ${filename}`, type: 'success' });
    } catch (err: any) {
      console.error('Export error:', err);
      setStatusMessage({ text: err.message || 'Export generation failed.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports/inventory" aria-label="Back to Inventory Reports" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Export Inventory Report</h1>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="ml-3 font-bold hover:opacity-75">✕</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleGenerateExport(); }}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Category Filter</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
            >
              <SelectOption value="All Categories">All Categories</SelectOption>
              <SelectOption value="Materials">Materials</SelectOption>
              <SelectOption value="Equipment">Equipment</SelectOption>
              <SelectOption value="Fuel">Fuel</SelectOption>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Format</label>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
            >
              <SelectOption value="xlsx">Excel Spreadsheet (.xlsx)</SelectOption>
              <SelectOption value="csv">CSV Data (.csv)</SelectOption>
              <SelectOption value="pdf">PDF Document (.pdf)</SelectOption>
            </Select>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Link href="/reports/inventory" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Cancel</Link>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  Generating...
                </>
              ) : (
                'Generate Export'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
