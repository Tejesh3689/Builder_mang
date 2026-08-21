'use client';

import React from 'react';
import Link from 'next/link';

export default function UploadLogoPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Upload Company Logo</h1>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm text-center">
        <div className="border-2 border-dashed border-zinc-300 rounded-xl p-12 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">Click to upload or drag and drop</h3>
          <p className="text-sm text-zinc-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
          <Link href="/admin/settings" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Cancel</Link>
          <button type="button" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Upload File</button>
        </div>
      </div>
    </div>
  );
}
