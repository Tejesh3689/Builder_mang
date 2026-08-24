import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EmployeesClient from '../EmployeesClient';

export default async function TeamEmployeesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userRole = (session.user as any)?.role || 'USER';
  const sessionName = session.user?.name || '';

  // Only Manager and Supervisor should access this directly (Admin can too but they use the main route)
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-black tracking-tight">{userRole === 'MANAGER' ? 'Extended Team' : 'My Team'}</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage employees reporting directly to you or your reports.</p>
      </div>
      
      <EmployeesClient userRole={userRole} sessionName={sessionName} />
    </div>
  );
}
