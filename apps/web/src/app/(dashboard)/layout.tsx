'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeOverride, setActiveOverride] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === '/materials') {
      if (!activeOverride || (activeOverride !== 'Inventory Overview' && activeOverride !== 'Materials')) {
        setActiveOverride('Inventory Overview');
      }
    } else {
      setActiveOverride(null);
    }
  }, [pathname]);

  const currentUser = session?.user;
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User Account';
  const userRole = (currentUser as any)?.role || 'USER';
  const userEmail = currentUser?.email || '';

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const getNavGroups = (role: string) => {
    if (role === 'SITE_ENGINEER') {
      return [
        {
          group: null,
          items: [
            { href: '/dashboard', label: 'Dashboard', icon: 'home' },
          ],
        },
        {
          group: 'Team Management',
          items: [
            { href: '/employees/team', label: 'My Team', icon: 'users' },
            { href: '/attendance', label: 'Attendance', icon: 'check' },
            { href: '/leave', label: 'Leave Management', icon: 'activity' },
          ],
        },
        {
          group: 'Operations',
          items: [
            { href: '/field-work', label: 'Field Work', icon: 'tasks' },
            { href: '/approvals', label: 'Approvals', icon: 'check' },
            { href: '/reports/team', label: 'Reports', icon: 'file' },
            { href: '/meetings', label: 'Meetings', icon: 'users' },
            { href: '/assets', label: 'Assets', icon: 'box' },
          ],
        },
        {
          group: 'System',
          items: [
            { href: '/notifications', label: 'Notifications', icon: 'bell', count: 4, alert: true },
            { href: '/profile', label: 'Profile', icon: 'settings' },
          ],
        },
      ];
    }

    if (role === 'PROJECT_MANAGER') {
      return [
        {
          group: null,
          items: [
            { href: '/dashboard', label: 'Dashboard', icon: 'home' },
          ],
        },
        {
          group: 'Ventures',
          items: [
            { href: '/ventures', label: 'My Ventures', icon: 'layers' },
          ],
        },
        {
          group: 'Team Management',
          items: [
            { href: '/employees/team', label: 'Extended Team', icon: 'users' },
            { href: '/attendance', label: 'Attendance', icon: 'check' },
            { href: '/leave', label: 'Leave Management', icon: 'activity' },
          ],
        },
        {
          group: 'Operations',
          items: [
            { href: '/field-work', label: 'Field Work', icon: 'tasks' },
            { href: '/approvals', label: 'Approvals', icon: 'check' },
            { href: '/reports/team', label: 'Reports', icon: 'file' },
            { href: '/meetings', label: 'Meetings', icon: 'users' },
            { href: '/assets', label: 'Assets', icon: 'box' },
          ],
        },
        {
          group: 'System',
          items: [
            { href: '/notifications', label: 'Notifications', icon: 'bell', count: 6, alert: true },
            { href: '/profile', label: 'Profile', icon: 'settings' },
          ],
        },
      ];
    }

    const groups = [
      {
        group: null,
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: 'home' },
        ],
      },
      {
        group: 'Ventures',
        items: [
          { href: '/ventures', label: 'All Ventures', icon: 'layers' },
        ],
      },
      {
        group: 'People',
        items: [
          { href: '/employees/dashboard', label: 'Employee Dashboard', icon: 'home' },
          { href: '/employees', label: 'Employees', icon: 'users' },
          { href: '/employees/managers', label: 'Managers', icon: 'briefcase' },
          { href: '/employees/supervisors', label: 'Supervisors', icon: 'shield' },
        ],
      },
      {
        group: 'Inventory',
        items: [
          { href: '/materials', label: 'Inventory Overview', icon: 'box' },
          { href: '/materials', label: 'Materials', icon: 'cube' },
          { href: '/materials/stock', label: 'Stock Movements', icon: 'stack' },
        ],
      },
      {
        group: 'Communication',
        items: [
          { href: '/chat', label: 'Venture Chat', icon: 'chat' },
          { href: '/notifications', label: 'Notifications', icon: 'bell' },
        ],
      },
      {
        group: 'Reports',
        items: [
          { href: '/reports/projects', label: 'Project Reports', icon: 'file' },
          { href: '/reports/employees', label: 'Employee Reports', icon: 'users' },
          { href: '/reports/inventory', label: 'Inventory Reports', icon: 'box' },
        ],
      },
    ];

    if (role === 'ADMIN') {
      groups.push({
        group: 'Administration',
        items: [
          { href: '/admin/users', label: 'Users', icon: 'users' },
          { href: '/admin/roles', label: 'Roles & Permissions', icon: 'shield' },
          { href: '/admin/branches', label: 'Branches / Locations', icon: 'pin' },
          { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'list' },
          { href: '/admin/settings', label: 'Company Settings', icon: 'settings' },
        ],
      });
    }

    return groups;
  };

  const navGroups = getNavGroups(userRole);

  function renderIcon(name: string) {
    const iconClass = "w-4 h-4 text-zinc-500 shrink-0";
    switch (name) {
      case 'home':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5" /></svg>;
      case 'layers':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>;
      case 'activity':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 12h4l2 7 4-14 2 7h6" /></svg>;
      case 'check':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>;
      case 'users':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><circle cx="17.5" cy="9" r="2.6" /><path d="M15 14.6c2.6.4 5 2 5 5.4" /></svg>;
      case 'briefcase':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>;
      case 'shield':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3.2 7.5-7 9-3.8-1.5-7-4-7-9V6l7-3z" /></svg>;
      case 'flag':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 3v18" /><path d="M6 4h11l-2.5 3.5L17 11H6" /></svg>;
      case 'box':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z" /><path d="M3.5 7.5 12 12l8.5-4.5" /><path d="M12 12v9" /></svg>;
      case 'cube':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M4 7.5 12 12l8-4.5" /><path d="M12 12v9" /></svg>;
      case 'stack':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 8l9-5 9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
      case 'file':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4" /></svg>;
      case 'truck':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2 7h11v9H2z" /><path d="M13 10h4l3 3v3h-7z" /><circle cx="6" cy="18" r="1.6" /><circle cx="16.5" cy="18" r="1.6" /></svg>;
      case 'building':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 21V6a1 1 0 0 1 1-1h6v16" /><path d="M11 21V10h8a1 1 0 0 1 1 1v10" /></svg>;
      case 'alert':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4" /><circle cx="12" cy="16.6" r=".4" fill="currentColor" /></svg>;
      case 'package':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 8V7a1 1 0 0 0-.5-.87L13 3l-6.5 3.13A1 1 0 0 0 6 7v10a1 1 0 0 0 .5.87L13 21l6.5-3.13A1 1 0 0 0 20 17v-1" /><path d="M13 3v18" /></svg>;
      case 'tasks':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8.5 10.5l1.8 1.8L14.5 8" /><path d="M8 16h8" /></svg>;
      case 'chat':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16v11H8l-4 4V4z" /></svg>;
      case 'bell':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0v5l1.5 3H4.5L6 14V9z" /><path d="M9.5 20a2.5 2.5 0 0 0 5 0" /></svg>;
      case 'pin':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></svg>;
      case 'list':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></svg>;
      case 'settings':
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 3.5h-4l-.3 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.9 7.9 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.3 2.6h4l.3-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5z" /></svg>;
      default:
        return <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg>;
    }
  }

  return (
    <div className="flex h-dvh bg-[#EAEAEA] text-black overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white border-r border-zinc-200/80 flex flex-col justify-between h-full shrink-0 shadow-lg lg:shadow-sm z-40 lg:z-30 lg:static transition-all duration-200 ease-in-out lg:relative ${isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
          } ${isMobileSidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Toggle Bar Button for Desktop Collapsing */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full border border-zinc-200 bg-white shadow-xs items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-50 z-50 cursor-pointer transition-transform duration-200"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg
            className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div>
          {/* Brand Header */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-5 px-2' : 'justify-between px-6 py-5'} border-b border-zinc-100`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm shadow-md shadow-black/10 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-black leading-none">Naprocs</span>
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-1">Builder Management</span>
                </div>
              )}
            </div>
            {/* Close Button on Mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className={`${isSidebarCollapsed ? 'p-2 space-y-4' : 'p-4 space-y-6'} overflow-y-auto max-h-[calc(100dvh-140px)]`}>
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {group.group && !isSidebarCollapsed && (
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                    {group.group}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = activeOverride
                    ? item.label === activeOverride
                    : pathname === item.href;
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      title={isSidebarCollapsed ? item.label : undefined}
                      onClick={() => {
                        setActiveOverride(item.label);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`flex items-center rounded-full text-xs font-medium transition-all duration-150 ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
                        } ${isActive
                          ? 'bg-[#FBEFDB] text-[#855B14] font-semibold shadow-sm'
                          : 'text-zinc-700 hover:bg-zinc-100 hover:text-black'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={isActive ? 'text-[#855B14]' : 'text-zinc-500'}>
                          {renderIcon(item.icon)}
                        </span>
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!isSidebarCollapsed && (item as any).count !== undefined && (
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${(item as any).alert
                              ? 'bg-red-100 text-red-700'
                              : isActive
                                ? 'bg-[#F2D7B4] text-[#704808]'
                                : 'bg-zinc-200/70 text-zinc-700'
                            }`}
                        >
                          {(item as any).count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Profile Chip */}
        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-t border-zinc-100`}>
          <div className={`flex items-center rounded-2xl bg-zinc-50 border border-zinc-200/80 ${isSidebarCollapsed ? 'p-1 justify-center' : 'p-2 justify-between'}`}>
            <div className="flex items-center gap-3 min-w-0">
              {isSidebarCollapsed ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="w-9 h-9 rounded-full bg-[#d97706] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm hover:bg-red-600 hover:text-white transition-colors"
                >
                  {initials}
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {initials}
                </div>
              )}
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-black truncate">{userName}</div>
                  <div className="text-[10px] text-zinc-500 truncate font-mono">{userRole} · {userEmail}</div>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <header className="h-16 glass-topbar flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Trigger for Mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open mobile menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-black leading-tight truncate max-w-[150px] sm:max-w-none">
                {pathname === '/dashboard' ? 'Dashboard Overview' : pathname.split('/').filter(Boolean).join(' / ').toUpperCase()}
              </h1>
              <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500">Live Workspace Status</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="hidden sm:flex items-center gap-2 bg-zinc-100 border border-zinc-200/80 rounded-full px-4 py-1.5 w-64 text-xs text-zinc-500">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span>Search ventures, materials...</span>
            </div>

            {/* Notification Button */}
            <button aria-label="Notifications" className="w-9 h-9 rounded-full border border-zinc-200 bg-white flex items-center justify-center relative hover:bg-zinc-100 transition-colors">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] font-bold font-mono rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                3
              </span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Children */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#EAEAEA]">
          {children}
        </main>
      </div>
    </div>
  );
}
