const fs = require('fs');
const path = require('path');

const groups = [
  { folder: 'admin', permission: 'ADMIN_ONLY' },
  { folder: 'compliance', permission: 'compliance:view' },
  { folder: 'workforce', permission: 'employees:view' },
  { folder: 'onboarding', permission: 'employees:edit' }
];

const template = (permission) => \`import React from 'react';
import { requireAuth } from '@/lib/authorization';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  
  \${permission === 'ADMIN_ONLY' ? \`
  if ((user as any).role !== 'ADMIN') {
    redirect('/unauthorized');
  }\` : \`
  if ((user as any).role !== 'ADMIN') {
    const { hasPermission } = await import('@/lib/permissions');
    if (!hasPermission((user as any).role, '\${permission}')) {
      redirect('/unauthorized');
    }
  }\`}
  
  return <>{children}</>;
}
\`;

groups.forEach(g => {
  const dir = path.join(__dirname, 'src/app/(dashboard)', g.folder);
  if (fs.existsSync(dir)) {
     fs.writeFileSync(path.join(dir, 'layout.tsx'), template(g.permission));
  }
});

// Create a generic unauthorized page
const unauthDir = path.join(__dirname, 'src/app/(dashboard)/unauthorized');
fs.mkdirSync(unauthDir, { recursive: true });
fs.writeFileSync(path.join(unauthDir, 'page.tsx'), \`import React from 'react';
export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 Forbidden</h1>
      <p className="text-zinc-600">You do not have permission to view this page.</p>
    </div>
  );
}\`);

console.log('Created protected layouts');
