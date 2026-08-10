import React from 'react';
import Link from 'next/link';

export default async function VentureChatPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const resolvedParams = await params;
  const vId = resolvedParams?.ventureId || 'ven-a';
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto rounded-xl border border-slate-855 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Room Header */}
      <div className="h-14 border-b border-slate-800 px-6 flex justify-between items-center bg-slate-900/50">
        <div>
          <h3 className="font-bold text-slate-100">{vId.toUpperCase()} Chat</h3>
          <span className="text-xs text-slate-400">Venture Room Discussion</span>
        </div>
        <Link href="/chat" className="text-xs text-indigo-400 hover:underline">Exit Room</Link>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900/20">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold">PM</div>
          <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-sm max-w-md">
            <span className="block text-xs font-bold text-indigo-400 mb-1">Project Manager</span>
            <span>Hi team, is the steel shipment received at the site?</span>
          </div>
        </div>

        <div className="flex items-start space-x-3 justify-end">
          <div className="p-3.5 rounded-2xl rounded-tr-none bg-indigo-600 text-sm max-w-md text-white">
            <span className="block text-xs font-bold text-indigo-200 mb-1">You</span>
            <span>Yes, 100 bags cement and steel rods have arrived and are logged in the ledger.</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold">SA</div>
        </div>
      </div>

      {/* Input panel */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center space-x-3">
        <input type="text" placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm">Send</button>
      </div>
    </div>
  );
}
