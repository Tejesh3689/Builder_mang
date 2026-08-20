'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA] px-4 py-12">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-2xl">
        <div className="text-center">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20 mb-3">
            Builder Management System
          </div>
          <h2 className="text-3xl font-bold text-black tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Sign up a new user directly into the database
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs text-center font-medium">
            Account created successfully! Redirecting to sign in...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-zinc-700">
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
              placeholder="Ajay Sharma"
            />
          </div>

          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-zinc-700">
              Email Address
            </label>
            <input
              id="email-address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
              placeholder="user@builder.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="block w-full pl-3.5 pr-11 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-2.5 rounded-lg text-white bg-[#d97706] hover:bg-amber-700 font-semibold transition-colors duration-200 shadow-md shadow-black/10 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Register User'}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-800 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
