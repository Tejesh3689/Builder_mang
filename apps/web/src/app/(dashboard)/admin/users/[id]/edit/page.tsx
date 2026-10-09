'use client';

import React, { useEffect, useState } from 'react';import { Select, SelectOption } from '@/components/ui/Select';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function EditUserPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">User not found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Edit User Profile</h1>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          const target = e.target as any;
          const name = target.name_input.value;
          const email = target.email_input.value;
          const role = target.role_input.value;
          const isActive = target.status_input.value === 'Active';

          try {
            const res = await fetch(`/api/admin/users/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, role, isActive })
            });
            if (res.ok) router.push('/admin/users');
            else alert('Failed to update user');
          } catch (err) {
            console.error(err);
            alert('An error occurred');
          }
        }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
              <input id="name_input" name="name_input" type="text" defaultValue={user.name} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
              <input id="email_input" name="email_input" type="email" defaultValue={user.email} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
              <Select id="role_input" name="role_input" defaultValue={user.role} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                <SelectOption value="MANAGER">Operations Manager</SelectOption>
                <SelectOption value="SITE_ENGINEER">Site Engineer</SelectOption>
                <SelectOption value="SUPERVISOR">Site Supervisor</SelectOption>
                <SelectOption value="ADMIN">System Administrator</SelectOption>
                <SelectOption value="PROCUREMENT_MANAGER">Procurement Manager</SelectOption>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Account Status</label>
              <Select id="status_input" name="status_input" defaultValue={user.isActive ? 'Active' : 'Inactive'} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                <SelectOption value="Active">Active</SelectOption>
                <SelectOption value="Inactive">Inactive</SelectOption>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Link href="/admin/users" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Cancel</Link>
            <button type="submit" className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-sm font-semibold">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
