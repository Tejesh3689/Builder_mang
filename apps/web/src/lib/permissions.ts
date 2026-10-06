import { UserRole } from '@builder/types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  MANAGER: [
    'ventures:view', 'ventures:edit',
    'materials:view', 'materials:request', 'materials:approve', 'materials:stock',
    'employees:view', 'employees:assign',
    'chat:access'
  ],
  MANAGER: [
    'ventures:view', 'ventures:edit',
    'materials:view', 'materials:request', 'materials:approve', 'materials:stock',
    'employees:view', 'employees:assign',
    'chat:access'
  ],
  SUPERVISOR: [
    'ventures:view',
    'materials:view', 'materials:request', 'materials:stock',
    'employees:view',
    'employees:view_team',
    'attendance:manage_team',
    'leave:approve_team',
    'fieldwork:manage_team',
    'reports:submit_dpr',
    'assets:view_team',
    'meetings:manage_team',
    'chat:access'
  ],
  SUPERVISOR: [
    'ventures:view',
    'materials:view', 'materials:request', 'materials:stock',
    'employees:view',
    'employees:view_team',
    'attendance:manage_team',
    'leave:approve_team',
    'fieldwork:manage_team',
    'reports:submit_dpr',
    'assets:view_team',
    'meetings:manage_team',
    'chat:access'
  ],
  STORE_MANAGER: [
    'ventures:view',
    'materials:view', 'materials:receive', 'materials:issue', 'materials:stock',
    'employees:view',
    'chat:access'
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}
