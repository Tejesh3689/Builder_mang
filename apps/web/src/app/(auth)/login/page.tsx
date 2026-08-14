'use client';

import React, { useState, Suspense } from 'react';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const TEST_USERS = [
  {
    role: 'ADMIN',
    title: 'Admin',
    email: 'admin@builder.com',
    password: 'password123',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    hoverBorder: 'hover:border-purple-500/50',
    description: 'Full system access & user management',
  },
  {
    role: 'PROJECT_MANAGER',
    title: 'Project Manager',
    email: 'pm@builder.com',
    password: 'password123',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/50',
    description: 'Venture tracking & high-level reports',
  },
  {
    role: 'SITE_ENGINEER',
    title: 'Site Engineer',
    email: 'engineer@builder.com',
    password: 'password123',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50',
    description: 'Material logs & site progress updates',
  },
  {
    role: 'STORE_MANAGER',
    title: 'Store Manager',
    email: 'store@builder.com',
    password: 'password123',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/50',
    description: 'Inventory, stock entry & material issues',
  },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSignIn = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPass,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Invalid credentials');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSignIn(email, password);
  };

  const handleQuickLogin = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    executeSignIn(testEmail, testPass);
  };

  return (
    <div className="w-full max-w-xl space-y-8 p-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
      <div className="text-center">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
          Builder Management System
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Sign In</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your credentials or select a test account below
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
              placeholder="email@builder.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold transition-colors duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>

      {/* Test Logins Section */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Test Accounts
          </span>
          <span className="text-xs text-slate-500">Click any card to auto-login</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEST_USERS.map((user) => (
            <button
              key={user.role}
              type="button"
              onClick={() => handleQuickLogin(user.email, user.password)}
              className={`p-3 rounded-xl bg-slate-900 border border-slate-800 text-left transition-all ${user.hoverBorder} hover:bg-slate-800/60 group`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${user.badgeColor}`}>
                  {user.title}
                </span>
                <span className="text-[11px] text-slate-500 group-hover:text-indigo-400 transition-colors">
                  Login &rarr;
                </span>
              </div>
              <div className="text-xs font-medium text-slate-200">{user.email}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{user.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading sign in...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

