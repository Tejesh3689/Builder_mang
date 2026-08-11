import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white px-4">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
          Builder Management System v1.0
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-100 bg-clip-text text-transparent">
          Manage Ventures, Materials & Teams
        </h1>
        <p className="text-lg text-slate-300 max-w-xl mx-auto">
          A production-grade modular monolith solution. Streamlining material stock ledgers, employee assignments, and secure real-time venture communications.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link href="/login" className="px-8 py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 shadow-lg shadow-indigo-600/30">
            Sign In to Portal
          </Link>
          <Link href="/dashboard" className="px-8 py-3 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors duration-200 border border-slate-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mt-16 text-left">
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-slate-100 mb-2">Material Ledgers</h3>
          <p className="text-slate-400 text-sm">
            Transactions, stock ins, stock outs, and requests tracked precisely inside a relational ledger db.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-slate-100 mb-2">Employee Database</h3>
          <p className="text-slate-400 text-sm">
            Venture-wise assignments, designation records, and document vaults mapped to secure profiles.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-slate-100 mb-2">Venture Chat</h3>
          <p className="text-slate-400 text-sm">
            Secure WebSocket chat rooms isolated by site membership for lightning-fast updates.
          </p>
        </div>
      </div>
    </div>
  );
}
