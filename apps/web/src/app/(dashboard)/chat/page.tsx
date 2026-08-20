import React from 'react';
import Link from 'next/link';

export default function ChatRoomsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Venture Chat Rooms</h1>
      <p className="text-sm text-zinc-500">Select a venture room below to engage in secure real-time discussion.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/chat/ven-a" className="p-6 rounded-xl bg-white border border-zinc-200 space-y-3 block hover-lift">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Venture Heights Room</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          </div>
          <p className="text-sm text-zinc-500">Assigned members: Admin, Project Manager, Site Engineer</p>
        </Link>
      </div>
    </div>
  );
}
