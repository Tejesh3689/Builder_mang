import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import TeamReportsClient from './TeamReportsClient';
import { toCalendarDate, leaveDurationDays } from '@builder/validation';
import { buildScopedWhere, requireAuth } from '@/lib/authorization';

export const revalidate = 0;

export default async function TeamReportsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';
  const sessionName = session?.user?.name || '';
  const user = await requireAuth();

  const scopedEmpWhere = await buildScopedWhere(user, 'employee');
  const isDenyAll = (scopedEmpWhere as any).id === 'DENY_ALL';

  const employees = isDenyAll
    ? []
    : await prisma.employee.findMany({
        where: {
          AND: [
            scopedEmpWhere,
            { status: { not: 'TERMINATED' } }
          ]
        },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: true,
          reportingManager: { select: { firstName: true, lastName: true } },
          assignments: {
            where: { status: 'ACTIVE' },
            include: { venture: { select: { id: true, name: true } } }
          }
        },
        orderBy: { firstName: 'asc' }
      });

  const employeeIds = employees.map(e => e.id);

  const [attendanceData, leavesData] = isDenyAll || employeeIds.length === 0
    ? [[], []]
    : await Promise.all([
        prisma.attendance.findMany({
          where: { employeeId: { in: employeeIds } },
          include: {
            employee: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                assignments: {
                  where: { status: 'ACTIVE' },
                  include: { venture: { select: { id: true, name: true } } }
                }
              }
            }
          },
          orderBy: { date: 'desc' }
        }),
        prisma.leaveRequest.findMany({
          where: { employeeId: { in: employeeIds } },
          include: {
            employee: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { startDate: 'desc' }
        })
      ]);

  const serializedAttendance = attendanceData.map(a => {
    const activeProject = a.employee.assignments?.[0]?.venture?.name || a.location || '—';
    const hours = a.checkIn && a.checkOut
      ? Math.round((a.checkOut.getTime() - a.checkIn.getTime()) / (1000 * 60 * 60) * 10) / 10
      : (a.status === 'PRESENT' || a.status === 'FIELD_WORK' ? 8 : 0);
    return {
      id: a.id,
      date: a.date.toISOString().split('T')[0],
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
      status: a.status === 'PRESENT' ? 'Present' :
              a.status === 'FIELD_WORK' ? 'Field Work' :
              a.status === 'LATE' ? 'Late' :
              a.status === 'ON_LEAVE' ? 'On Leave' : 'Absent',
      rawStatus: a.status,
      login: a.checkIn ? a.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      logout: a.checkOut ? a.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      hours,
      site: activeProject
    };
  });

  const serializedLeaves = leavesData.map(l => ({
    id: l.id,
    employeeName: `${l.employee.firstName} ${l.employee.lastName}`.trim(),
    type: l.type.replace('_', ' '),
    startDate: toCalendarDate(l.startDate),
    endDate: toCalendarDate(l.endDate),
    duration: leaveDurationDays(l.startDate, l.endDate),
    status: l.status
  }));

  const serializedFieldWork = attendanceData
    .filter(a => a.status === 'FIELD_WORK')
    .map(a => {
      const activeProject = a.employee.assignments?.[0]?.venture?.name || 'Assigned Site';
      const hours = a.checkIn && a.checkOut
        ? Math.round((a.checkOut.getTime() - a.checkIn.getTime()) / (1000 * 60 * 60) * 10) / 10
        : 8;
      return {
        id: a.id,
        date: a.date.toISOString().split('T')[0],
        employeeName: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
        client: activeProject,
        location: a.location || 'Site Location',
        duration: hours,
        status: 'Completed'
      };
    });

  const serializedEmployees = employees.map(e => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`.trim()
  }));

  return (
    <TeamReportsClient 
      userRole={userRole} 
      sessionName={sessionName} 
      initialAttendance={serializedAttendance}
      initialLeaves={serializedLeaves}
      initialFieldWork={serializedFieldWork}
      employees={serializedEmployees}
    />
  );
}
