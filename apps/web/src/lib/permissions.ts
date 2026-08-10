import { UserRole } from '@builder/types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  PROJECT_MANAGER: [
    'ventures:view', 'ventures:edit',
    'materials:view', 'materials:request', 'materials:approve', 'materials:stock',
    'employees:view', 'employees:assign',
    'chat:access'
  ],
  SITE_ENGINEER: [
    'ventures:view',
    'materials:view', 'materials:request', 'materials:stock',
    'employees:view',
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
