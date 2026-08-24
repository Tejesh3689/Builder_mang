import React from 'react';

export default function PlaceholderPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-12 rounded-2xl border border-zinc-200/80 shadow-xs text-center max-w-md w-full">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
          <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-black tracking-tight mb-2">Coming Soon</h1>
        <p className="text-sm text-zinc-500 font-medium">This module is currently under development. Please check back later.</p>
      </div>
    </div>
  );
}
