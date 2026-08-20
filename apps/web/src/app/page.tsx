import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EAEAEA] text-zinc-900 px-4">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/25 backdrop-blur-md">
          Builder Management System v1.0
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-zinc-950">
          Manage Ventures, Materials & Teams
        </h1>
        <p className="text-lg text-zinc-600 max-w-xl mx-auto">
          A production-grade modular monolith solution. Streamlining material stock ledgers, employee assignments, and secure real-time venture communications.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link href="/login" className="px-8 py-3 rounded-xl font-semibold bg-[#d97706] hover:bg-amber-700 text-white transition-colors duration-200 shadow-md shadow-black/10">
            Sign In to Portal
          </Link>
          <Link href="/dashboard" className="px-8 py-3 rounded-xl font-semibold bg-white hover:bg-zinc-100 text-zinc-800 transition-colors duration-200 border border-zinc-300 shadow-xs">
            Go to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mt-16 text-left">
        <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-zinc-800 mb-2">Material Ledgers</h3>
          <p className="text-zinc-500 text-sm">
            Transactions, stock ins, stock outs, and requests tracked precisely inside a relational ledger db.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-zinc-800 mb-2">Employee Database</h3>
          <p className="text-zinc-500 text-sm">
            Venture-wise assignments, designation records, and document vaults mapped to secure profiles.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-zinc-800 mb-2">Venture Chat</h3>
          <p className="text-zinc-500 text-sm">
            Secure WebSocket chat rooms isolated by site membership for lightning-fast updates.
          </p>
        </div>
      </div>
    </div>
  );
}
