import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import { businessToday } from '@/lib/validation/common';

export const revalidate = 0;

/** [start, end) of the current business (IST) day as UTC instants. */
function todayRange() {
  const start = new Date(businessToday().getTime() - 330 * 60 * 1000);
  return { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function timeAgo(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const LEAVE_LABEL: Record<string, string> = { SICK: 'Sick Leave', CASUAL: 'Casual Leave', PAID: 'Paid Leave', UNPAID: 'Unpaid Leave' };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';
  const userId = (session?.user as any)?.id as string | undefined;

  if (userRole === 'SUPERVISOR') {
    // The team is everyone whose reportingManagerId is this supervisor's *employee* id.
    const me = userId ? await prisma.employee.findUnique({ where: { userId }, select: { id: true } }) : null;
    const team = me
      ? await prisma.employee.findMany({
        where: { reportingManagerId: me.id, status: { not: 'TERMINATED' } },
        select: { id: true, firstName: true, lastName: true, designation: true },
        orderBy: { firstName: 'asc' },
      })
      : [];
    const teamIds = team.map((t) => t.id);
    const name = (e: { firstName: string; lastName: string }) => `${e.firstName} ${e.lastName}`.trim();

    const [todayAttendance, leaves] = await Promise.all([
      prisma.attendance.findMany({ where: { employeeId: { in: teamIds }, date: todayRange() } }),
      prisma.leaveRequest.findMany({
        where: { employeeId: { in: teamIds }, status: 'PENDING' },
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
    const byEmployee = new Map(todayAttendance.map((a) => [a.employeeId, a]));
    const teamById = new Map(team.map((t) => [t.id, t]));
    const countStatus = (st: string) => todayAttendance.filter((a) => a.status === st).length;

    const stats = [
      { label: 'Total Team Members', count: team.length, tone: { bg: 'bg-zinc-50 border-zinc-200', text: 'text-zinc-800', dot: 'bg-zinc-500' } },
      { label: 'Present Today', count: countStatus('PRESENT'), tone: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' } },
      // Team members with no attendance record yet today count as absent.
      { label: 'Absent Today', count: countStatus('ABSENT') + (team.length - todayAttendance.length), tone: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' } },
      { label: 'Late Today', count: countStatus('LATE'), tone: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' } },
      { label: 'On Leave', count: countStatus('ON_LEAVE'), tone: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' } },
      { label: 'Field Work', count: countStatus('FIELD_WORK'), tone: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' } },
    ];

    const pendingLeaves = leaves.map((l) => ({
      emp: name(l.employee),
      type: LEAVE_LABEL[l.type] ?? l.type,
      dates: `${fmtDate(l.startDate)} - ${fmtDate(l.endDate)}`,
      status: 'Pending',
    }));

    const pendingFieldWork = todayAttendance
      .filter((a) => a.status === 'FIELD_WORK')
      .map((a) => ({ emp: name(teamById.get(a.employeeId)!), task: 'Field Work', loc: a.location || '—', status: 'Today' }));

    const teamActivities = todayAttendance
      .filter((a) => a.checkIn)
      .sort((a, b) => b.checkIn!.getTime() - a.checkIn!.getTime())
      .slice(0, 5)
      .map((a) => ({ t: `${name(teamById.get(a.employeeId)!)} checked in${a.location ? ` at ${a.location}` : ''}`, ts: timeAgo(a.checkIn!) }));

    const STATUS_VIEW: Record<string, { label: string; tone: string }> = {
      PRESENT: { label: 'Present', tone: 'emerald' },
      LATE: { label: 'Late', tone: 'amber' },
      ABSENT: { label: 'Absent', tone: 'red' },
      ON_LEAVE: { label: 'On Leave', tone: 'blue' },
      FIELD_WORK: { label: 'Field Work', tone: 'purple' },
    };
    const teamAttendanceList = team.map((t) => {
      const a = byEmployee.get(t.id);
      const view = a ? STATUS_VIEW[a.status] : { label: 'Not marked', tone: 'red' };
      return { name: name(t), role: t.designation, timeIn: a?.checkIn ? fmtTime(a.checkIn) : '—', status: view.label, tone: view.tone };
    });

    const quickActions = [
      { label: 'Team Attendance', icon: 'users', href: '/attendance', color: 'text-emerald-600' },
      { label: 'Pending Approvals', icon: 'check', href: '/approvals', color: 'text-amber-600' },
      { label: 'Team Chat', icon: 'message-square', href: '/chat', color: 'text-blue-600' }
    ];

    return <SupervisorDashboard
      stats={stats}
      pendingLeaves={pendingLeaves}
      pendingFieldWork={pendingFieldWork}
      teamActivities={teamActivities}
      teamAttendance={teamAttendanceList}
      quickActions={quickActions}
    />;
  }

  if (userRole === 'MANAGER') {
    return <ManagerDashboard />;
  }

  let pendingCount = 0;
  let pendingRequests: any[] = [];
  let activeVentures: any[] = [];
  let inventoryAlerts: any[] = [];
  let siteActivities: any[] = [];

  try {
    const [count, dbRequests, dbVentures, lowStock, audit] = await Promise.all([
      prisma.materialRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.materialRequest.findMany({
        where: { status: 'PENDING_APPROVAL' },
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { venture: true, createdBy: true, items: { include: { material: true } } },
      }),
      prisma.venture.findMany(),
      // Stock at or below the material's reorder level; "Critical" at/below the minimum level.
      prisma.$queryRaw<{ name: string; location: string; available: string; minimum: string }[]>`
        SELECT m."name", l."name" AS location, s."availableQuantity"::text AS available, m."minimumStockLevel"::text AS minimum
        FROM material_stocks s
        JOIN materials m ON m.id = s."materialId"
        JOIN stock_locations l ON l.id = s."stockLocationId"
        WHERE m.status = 'ACTIVE'
          AND (m."reorderLevel" > 0 OR m."minimumStockLevel" > 0)
          AND s."availableQuantity" <= GREATEST(m."reorderLevel", m."minimumStockLevel")
        ORDER BY s."availableQuantity" - GREATEST(m."reorderLevel", m."minimumStockLevel") ASC
        LIMIT 5`,
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } }, venture: { select: { name: true } } },
      }),
    ]);

    pendingCount = count;
    pendingRequests = dbRequests.map((r: any) => ({
      id: r.requestNumber,
      company: r.venture?.name || '—',
      requestedBy: r.createdBy?.name || '—',
      material: r.items[0]?.material?.name
        ? `${r.items[0].material.name}${r.items.length > 1 ? ` +${r.items.length - 1}` : ''}`
        : '—',
      date: r.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      priority: r.priority === 'URGENT' ? 'Critical' : r.priority === 'HIGH' ? 'High' : r.priority === 'LOW' ? 'Low' : 'Normal',
      status: 'Pending',
    }));

    activeVentures = dbVentures.map((v: any) => ({
      id: v.id,
      name: v.name,
      code: v.code,
      location: [v.siteCity || v.regCity, v.siteState || v.regState].filter(Boolean).join(', ') || '—',
      progress: v.progressPercentage ?? 0,
      status: v.status === 'ACTIVE' ? 'on-track'
        : v.status === 'ON_HOLD' ? 'at-risk'
          : v.status === 'CANCELLED' ? 'delayed'
            : v.status.toLowerCase(),
    }));

    inventoryAlerts = lowStock.map((r) => {
      const critical = Number(r.available) <= Number(r.minimum);
      return { name: r.name, location: r.location, status: critical ? 'Critical' : 'Low Stock', tone: critical ? 'red' : 'amber' };
    });

    siteActivities = audit.map((a) => ({
      t: `${a.user?.name ?? 'Someone'}: ${a.action.replace(/_/g, ' ').toLowerCase()}${a.venture?.name ? ` (${a.venture.name})` : ''}`,
      ts: timeAgo(a.createdAt),
    }));
    let materialConsumption: { label: string; pct: string; color: string }[] = [];

    // Fetch material consumption
    const totalMaterials = await prisma.material.count();
    if (totalMaterials > 0) {
      const topMaterials = await prisma.material.findMany({
        take: 4,
        orderBy: { minimumStockLevel: 'desc' }, // Just an approximation of popular materials
      });
      const colors = ['bg-amber-600', 'bg-zinc-600', 'bg-emerald-700', 'bg-amber-800'];
      materialConsumption = topMaterials.map((m, i) => ({
        label: m.name,
        pct: '0%', // Removed mock math. We will add actual consumption tracking freshly later.
        color: colors[i] || 'bg-zinc-400',
      }));
    } else {
      materialConsumption = [];
    }
  } catch (err) {
    console.error('Error fetching dashboard data from DB:', err);
  }

  return (
    <AdminDashboard
      activeVentures={activeVentures}
      pendingRequests={pendingRequests}
      pendingCount={pendingCount}
      inventoryAlerts={inventoryAlerts}
      siteActivities={siteActivities}
      materialConsumption={typeof materialConsumption !== 'undefined' ? materialConsumption : []}
    />
  );
}
