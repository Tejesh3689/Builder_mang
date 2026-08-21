'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DeleteUserPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-lg mx-auto mt-20">
      <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Delete User Account</h1>
          <p className="text-zinc-500">
            Are you absolutely sure you want to delete this user? This action cannot be undone and will permanently remove their access to the Builder Management Portal.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Link href="/admin/users" className="px-6 py-2.5 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Cancel, keep user</Link>
          <button onClick={() => router.push('/admin/users')} type="button" className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Yes, delete user</button>
        </div>
      </div>
    </div>
  );
}
