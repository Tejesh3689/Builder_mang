import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AttendanceClient from './AttendanceClient';

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userRole = (session.user as any)?.role || 'USER';
  const sessionName = session.user?.name || '';

  return <AttendanceClient userRole={userRole} sessionName={sessionName} />;
}
