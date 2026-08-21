'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DemoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const actionName = searchParams.get('action') || 'An Action';
  const source = searchParams.get('source') || 'a previous screen';

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg className="w-10 h-10 text-[#d97706]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Feature in Progress</h1>
      <p className="text-zinc-500 max-w-md mx-auto mb-8 text-lg">
        You triggered the <span className="font-bold text-black">"{actionName}"</span> action from {source}. 
        This is a demo screen. In a fully implemented backend, this button would perform the requested action.
      </p>

      <button 
        onClick={() => router.back()}
        className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Go Back
      </button>
    </div>
  );
}
