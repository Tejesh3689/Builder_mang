import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import TeamReportsClient from './TeamReportsClient';

export const revalidate = 0;

export default async function TeamReportsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';
  const sessionName = session?.user?.name || '';
  
  const [attendanceData, leavesData] = await Promise.all([
    prisma.attendance.findMany({
      include: { employee: true },
      orderBy: { date: 'desc' }
    }),
    prisma.leaveRequest.findMany({
      include: { employee: true },
      orderBy: { startDate: 'desc' }
    })
  ]);

  const serializedAttendance = attendanceData.map(a => ({
    id: a.id,
    date: a.date.toISOString().split('T')[0],
    employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
    status: a.status === 'PRESENT' ? 'Present' : 'Absent',
    login: a.checkIn ? a.checkIn.toLocaleTimeString() : '-',
    logout: a.checkOut ? a.checkOut.toLocaleTimeString() : '-',
    hours: a.checkIn && a.checkOut ? Math.round((a.checkOut.getTime() - a.checkIn.getTime()) / (1000 * 60 * 60) * 100) / 100 : 0,
    site: 'Main Site' // placeholder for site
  }));

  const serializedLeaves = leavesData.map(l => ({
    id: l.id,
    employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
    type: l.leaveType.replace('_', ' '),
    startDate: l.startDate.toISOString().split('T')[0],
    endDate: l.endDate.toISOString().split('T')[0],
    duration: Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    status: l.status
  }));

  return <TeamReportsClient 
    userRole={userRole} 
    sessionName={sessionName} 
    initialAttendance={serializedAttendance}
    initialLeaves={serializedLeaves}
  />;
}
