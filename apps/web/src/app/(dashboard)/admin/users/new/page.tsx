'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FieldError, useFieldErrors } from '@/lib/form-errors';

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fe = useFieldErrors();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'MANAGER',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    fe.clear();

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/users');
      } else {
        const hasFieldErrors = fe.setFromError(data);
        setError(hasFieldErrors ? 'Please correct the highlighted fields.' : data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Add New User</h1>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 mb-1">First Name *</label>
              <input
                id="firstName"
                {...fe.props('firstName')}
                type="text"
                required
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <FieldError id="firstName" errors={fe.errors} />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 mb-1">Last Name</label>
              <input
                id="lastName"
                {...fe.props('lastName')}
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <FieldError id="lastName" errors={fe.errors} />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">Email Address *</label>
            <input
              id="email"
              {...fe.props('email')}
              type="email"
              required
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <FieldError id="email" errors={fe.errors} />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">Password *</label>
            <input
              id="password"
              {...fe.props('password')}
              type="password"
              required
              minLength={6}
              placeholder="••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <FieldError id="password" errors={fe.errors} />
            <p className="text-xs text-zinc-500 mt-1">Minimum 6 characters.</p>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-zinc-700 mb-1">Assign Role *</label>
            <select
              id="role"
              {...fe.props('role')}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
            >
              <option value="MANAGER">Project Manager</option>
              <option value="SUPERVISOR">Site Engineer</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
            </select>
            <FieldError id="role" errors={fe.errors} />
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Link href="/admin/users" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
