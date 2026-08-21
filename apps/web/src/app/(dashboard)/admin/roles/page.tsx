import React from 'react';

const mockRoles = [
  { id: 'ROL-1', name: 'Super Admin', users: 2, description: 'Full access to all modules and settings.' },
  { id: 'ROL-2', name: 'Project Manager', users: 8, description: 'Can manage projects, tasks, and team members.' },
  { id: 'ROL-3', name: 'Site Manager', users: 15, description: 'Can update site logs, inventory, and attendance.' },
  { id: 'ROL-4', name: 'Auditor', users: 3, description: 'Read-only access to reports and financial data.' },
];

export default function RolesPermissionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Roles & Permissions</h1>
        <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Create Role</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockRoles.map(role => (
          <div key={role.id} className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{role.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{role.description}</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{role.users} Users</span>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-600">Permissions</span>
              <button className="text-sm font-semibold text-amber-600 hover:text-amber-700">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
