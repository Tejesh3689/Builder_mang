import { UserRole } from '@builder/types';

// Canonical roles: ADMIN, MANAGER, SUPERVISOR (Prisma enum UserRole, @builder/types UserRole).
// ADMIN-only permissions (granted via '*', listed nowhere else on purpose):
//   employees:create, employees:terminate, admin:users
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  MANAGER: [
    'ventures:view', 'ventures:edit', 'ventures:create', 'ventures:archive',
    'materials:view', 'materials:create', 'materials:request', 'materials:approve', 'materials:stock', 'materials:issue', 'materials:receive',
    'materials:transfer', 'materials:return', 'materials:adjust',
    'employees:view', 'employees:assign', 'employees:edit', 'documents:view', 'documents:edit', 'skills:edit', 'certifications:edit',
    'chat:access', 'chat:manage'
  ],
  SUPERVISOR: [
    'ventures:view',
    'materials:view', 'materials:request', 'materials:stock', 'materials:issue', 'materials:receive',
    'materials:transfer', 'materials:return',
    'employees:view',
    'employees:view_team', 'documents:view', 'documents:edit', 'skills:edit', 'certifications:edit',
    'attendance:manage_team',
    'leave:approve_team',
    'fieldwork:manage_team',
    'reports:submit_dpr',
    'assets:view_team',
    'meetings:manage_team',
    'chat:access'
  ],
  SITE_ENGINEER: [
    'ventures:view',
    'materials:view', 'materials:request',
    'employees:view', 'employees:view_team',
    'attendance:manage_team',
    'reports:submit_dpr',
    'chat:access'
  ],
  PROCUREMENT_MANAGER: [
    'ventures:view',
    'materials:view', 'materials:create', 'materials:approve', 'materials:stock', 'materials:issue', 'materials:receive', 'materials:transfer', 'materials:return', 'materials:adjust',
    'chat:access'
  ]
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}
