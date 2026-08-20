import React from 'react';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your email to receive a password reset link
          </p>
        </div>
        <form className="mt-8 space-y-6">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-zinc-300">
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="email@builder.com"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-black bg-amber-500 hover:bg-amber-600 font-semibold transition-colors duration-200"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
