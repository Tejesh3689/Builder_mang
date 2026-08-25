import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';

  if (userRole === 'SITE_ENGINEER') {
    const sessionName = session?.user?.name || '';
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const team = await prisma.employee.findMany({
      where: { reportingManager: sessionName },
      select: { id: true, firstName: true, lastName: true, designation: true }
    });
    
    const teamIds = team.map(t => t.id);
    
    const teamCount = await prisma.employee.count({ where: { reportingManager: sessionName } });

    // Mock data for models that don't exist in Prisma yet
    const present = Math.min(teamCount, 18);
    const absent = teamCount > 18 ? 2 : 0;
    const late = teamCount > 20 ? 1 : 0;
    const onLeave = teamCount > 21 ? 3 : 0;
    const fieldWork = teamCount > 24 ? 4 : 0;

    const stats = [
      { label: 'Total Team Members', count: teamCount, tone: { bg: 'bg-zinc-50 border-zinc-200', text: 'text-zinc-800', dot: 'bg-zinc-500' } },
      { label: 'Present Today', count: present, tone: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' } },
      { label: 'Absent Today', count: absent, tone: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' } },
      { label: 'Late Today', count: late, tone: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' } },
      { label: 'On Leave', count: onLeave, tone: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' } },
      { label: 'Field Work', count: fieldWork, tone: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' } },
    ];

    const pendingLeaves = [
      { emp: 'Ravi Kumar', type: 'Sick Leave', dates: '12 Aug - 13 Aug', status: 'Pending' },
      { emp: 'Anil Desai', type: 'Casual Leave', dates: '15 Aug - 16 Aug', status: 'Pending' }
    ];

    const pendingFieldWork = [
      { emp: 'Suresh Babu', task: 'Site Inspection', loc: 'Skyline Heights', status: 'Pending' }
    ];

    const teamActivities = [
      { t: 'Ravi Kumar checked in at Green Valley Residency', ts: '10 min ago' },
      { t: 'Anil Desai submitted field report for Block A', ts: '1 hr ago' },
      { t: 'Suresh Babu marked absent', ts: '3 hr ago' }
    ];

    const teamAttendanceList = [
      { name: 'Ravi Kumar', role: 'Electrician', timeIn: '08:00 AM', status: 'Present', tone: 'emerald' },
      { name: 'Anil Desai', role: 'Plumber', timeIn: '08:15 AM', status: 'Late', tone: 'amber' },
      { name: 'Suresh Babu', role: 'Mason', timeIn: '—', status: 'Absent', tone: 'red' },
      { name: 'Manoj Tiwari', role: 'Helper', timeIn: '—', status: 'On Leave', tone: 'blue' },
    ];

    const quickActions = [
      { label: 'Team Attendance', icon: 'users', href: '/attendance', color: 'text-emerald-600' },
      { label: 'Pending Approvals', icon: 'check', href: '/approvals', color: 'text-amber-600' },
      { label: 'Team Chat', icon: 'message-square', href: '/chat', color: 'text-blue-600' }
    ];

    return <SupervisorDashboard 
      stats={stats} 
      pendingLeaves={pendingLeaves} 
      pendingFieldWork={pendingFieldWork} 
      teamActivities={[]} 
      teamAttendance={teamAttendanceList} 
      quickActions={quickActions}
    />;
  }

  if (userRole === 'MANAGER') {
    return <ManagerDashboard />;
  }

  let counts = { ventures: 5, employees: 12, materials: 9, requests: 2, issues: 3, vendors: 7 };
  let pendingRequests: any[] = [];
  let activeVentures: any[] = [];
  let inventoryAlerts: any[] = [];

  try {
    const [vCount, eCount, mCount, rCount] = await Promise.all([
      prisma.venture.count(),
      prisma.employee.count(),
      prisma.material.count(),
      prisma.materialRequest.count({ where: { status: 'PENDING' } }),
    ]);

    counts = {
      ventures: vCount ?? 0,
      employees: eCount ?? 0,
      materials: mCount ?? 0,
      requests: rCount ?? 0,
      issues: 3,
      vendors: 7,
    };

    const dbRequests = await prisma.materialRequest.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        venture: true,
        createdBy: true,
        items: { include: { material: true } },
      },
    });

    if (dbRequests.length > 0) {
      pendingRequests = dbRequests.map((r: any) => ({
        id: r.id.substring(0, 8),
        company: r.venture?.name || 'Venture Site',
        requestedBy: r.createdBy?.name || 'Staff Member',
        material: r.items[0]?.material?.name || 'Material Item',
        date: r.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        priority: 'High',
        status: r.status,
      }));
    }

    const dbVentures = await prisma.venture.findMany();
    if (dbVentures.length > 0) {
      activeVentures = dbVentures.map((v: any) => ({
        id: v.id,
        name: v.name,
        code: v.code,
        location: `${v.regCity || 'Site'}, ${v.regState || 'India'}`,
        progress: v.progressPercentage ?? 0,
        status: v.status === 'ACTIVE' ? 'on-track'
          : v.status === 'ON_HOLD' ? 'at-risk'
          : v.status === 'CANCELLED' ? 'delayed'
          : v.status.toLowerCase(),
      }));
    }
  } catch (err) {
    console.error('Error fetching dashboard counts from DB:', err);
  }

  // Fallbacks matching exact prototype screenshot data
  if (pendingRequests.length === 0) {
    pendingRequests = [
      { id: 'MR-1042', company: 'Green Valley Residency', requestedBy: 'Krishna Rao', material: 'Cement', date: '11 Aug 2026', priority: 'High', status: 'Pending' },
      { id: 'MR-1041', company: 'Skyline Heights', requestedBy: 'Suresh Kumar', material: 'Steel', date: '11 Aug 2026', priority: 'Critical', status: 'Pending' },
    ];
  }

  if (activeVentures.length === 0) {
    activeVentures = [
      { id: 'v1', name: 'Green Valley Residency', code: 'GVR-2024-01', location: 'Kondapur, Hyderabad', progress: 68, status: 'on-track' },
      { id: 'v2', name: 'Skyline Heights', code: 'SKH-2024-02', location: 'Whitefield, Bengaluru', progress: 42, status: 'at-risk' },
      { id: 'v3', name: 'Riverfront Towers', code: 'RFT-2023-11', location: 'OMR, Chennai', progress: 91, status: 'on-track' },
      { id: 'v4', name: 'Sunrise Villas', code: 'SRV-2024-05', location: 'Baner, Pune', progress: 15, status: 'delayed' },
    ];
  }

  inventoryAlerts = [
    { name: 'Steel — TMT Bars 12mm', location: 'SKH Yard', status: 'Low Stock', tone: 'amber' },
    { name: 'Red Clay Bricks', location: 'RFT Store', status: 'Low Stock', tone: 'amber' },
    { name: 'Exterior Emulsion Paint', location: 'RFT Store', status: 'Critical', tone: 'red' },
  ];

  const siteActivities = [
    { t: 'Krishna Rao submitted the daily report for Green Valley Residency — Tower A', ts: '14 min ago' },
    { t: '500 bags of Cement received at Green Valley Residency (PO-3341)', ts: '2 hr ago' },
    { t: '80 bags of Cement transferred from Riverfront Towers to Green Valley Residency', ts: '2 hr ago' },
    { t: 'New critical issue raised at Skyline Heights — missing guardrails', ts: '3 hr ago' },
  ];

  return (
    <AdminDashboard 
      activeVentures={activeVentures} 
      pendingRequests={pendingRequests} 
      inventoryAlerts={inventoryAlerts} 
      siteActivities={siteActivities} 
    />
  );
}
