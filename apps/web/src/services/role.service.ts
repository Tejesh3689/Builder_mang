import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

export interface RoleDefinition {
  id: string; // e.g. 'ADMIN', 'MANAGER', or custom ID e.g. 'QUALITY_AUDITOR'
  name: string; // e.g. 'Operations Manager' or 'Quality Auditor'
  description: string;
  isCustom?: boolean;
  baseRole: UserRole; // 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'SITE_ENGINEER' | 'PROCUREMENT_MANAGER'
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const SYSTEM_DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'ADMIN',
    name: 'System Administrator',
    description: 'Full access to all system settings, user governance, branches, and audit logs.',
    baseRole: 'ADMIN',
    isCustom: false,
  },
  {
    id: 'MANAGER',
    name: 'Operations Manager',
    description: 'Manages construction ventures, approvals, field reports, and materials workflow.',
    baseRole: 'MANAGER',
    isCustom: false,
  },
  {
    id: 'SITE_ENGINEER',
    name: 'Site Engineer',
    description: 'Oversees site execution, daily progress reports, and inventory consumption.',
    baseRole: 'SITE_ENGINEER',
    isCustom: false,
  },
  {
    id: 'SUPERVISOR',
    name: 'Site Supervisor',
    description: 'Monitors ground workforce, daily labor attendance, and site logs.',
    baseRole: 'SUPERVISOR',
    isCustom: false,
  },
  {
    id: 'PROCUREMENT_MANAGER',
    name: 'Procurement Manager',
    description: 'Manages purchase requests, material orders, supplier receipts, and stock.',
    baseRole: 'PROCUREMENT_MANAGER',
    isCustom: false,
  },
];

const AUDIT_ACTION = 'SYSTEM_ROLES_CONFIG';

/**
 * Returns all system and custom roles stored in the persistent configuration.
 */
export async function getAllRoles(): Promise<RoleDefinition[]> {
  try {
    const log = await prisma.auditLog.findFirst({
      where: { action: AUDIT_ACTION },
      orderBy: { createdAt: 'desc' },
      select: { details: true },
    });

    if (!log || !log.details) {
      return SYSTEM_DEFAULT_ROLES;
    }

    const parsed = JSON.parse(log.details);
    const customRoles: RoleDefinition[] = Array.isArray(parsed.customRoles) ? parsed.customRoles : [];
    const roleOverrides: Record<string, any> = parsed.roleOverrides || {};

    const systemRoles = SYSTEM_DEFAULT_ROLES.map((role) => {
      const override = roleOverrides[role.id];
      if (override) {
        return {
          ...role,
          name: override.name || role.name,
          description: override.description || role.description,
          permissions: override.permissions || role.permissions,
        };
      }
      return role;
    });

    return [...systemRoles, ...customRoles];
  } catch (e) {
    console.error('Error loading roles from config:', e);
    return SYSTEM_DEFAULT_ROLES;
  }
}

/**
 * Fetch a single role by its id (system or custom).
 */
export async function getRoleById(roleId: string): Promise<RoleDefinition | null> {
  const roles = await getAllRoles();
  const normalized = roleId.toUpperCase();
  return roles.find((r) => r.id.toUpperCase() === normalized) || null;
}

/**
 * Creates a new custom role or adds it to the configuration.
 */
export async function createCustomRole(
  actorUserId: string,
  data: {
    name: string;
    description?: string;
    baseRole: UserRole;
    permissions?: string[];
  }
): Promise<RoleDefinition> {
  const roles = await getAllRoles();
  const cleanId = data.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!cleanId) {
    throw new Error('Role name must contain valid characters.');
  }

  // Ensure unique ID
  const existing = roles.find((r) => r.id === cleanId);
  if (existing) {
    throw new Error(`A role with ID or name "${cleanId}" already exists.`);
  }

  const newRole: RoleDefinition = {
    id: cleanId,
    name: data.name.trim(),
    description: data.description?.trim() || `Custom ${data.baseRole.replace(/_/g, ' ')} operational role.`,
    baseRole: data.baseRole,
    isCustom: true,
    permissions: data.permissions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const customRoles = roles.filter((r) => r.isCustom);
  customRoles.push(newRole);

  // Extract any overrides for system roles
  const log = await prisma.auditLog.findFirst({
    where: { action: AUDIT_ACTION },
    orderBy: { createdAt: 'desc' },
    select: { details: true },
  });
  const currentDetails = log?.details ? JSON.parse(log.details) : {};
  const roleOverrides = currentDetails.roleOverrides || {};

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: AUDIT_ACTION,
      details: JSON.stringify({
        customRoles,
        roleOverrides,
        lastUpdated: new Date().toISOString(),
      }),
    },
  });

  return newRole;
}

/**
 * Updates permissions or metadata for any role.
 */
export async function updateRolePermissions(
  actorUserId: string,
  roleId: string,
  data: {
    permissions?: string[];
    matrix?: Record<string, Record<string, boolean>>;
    name?: string;
    description?: string;
  }
): Promise<RoleDefinition> {
  const roles = await getAllRoles();
  const target = roles.find((r) => r.id.toUpperCase() === roleId.toUpperCase());
  if (!target) {
    throw new Error(`Role "${roleId}" not found.`);
  }

  const log = await prisma.auditLog.findFirst({
    where: { action: AUDIT_ACTION },
    orderBy: { createdAt: 'desc' },
    select: { details: true },
  });
  const currentDetails = log?.details ? JSON.parse(log.details) : {};
  let customRoles: RoleDefinition[] = Array.isArray(currentDetails.customRoles) ? currentDetails.customRoles : [];
  const roleOverrides = currentDetails.roleOverrides || {};

  if (target.isCustom) {
    customRoles = customRoles.map((r) => {
      if (r.id.toUpperCase() === roleId.toUpperCase()) {
        return {
          ...r,
          name: data.name?.trim() || r.name,
          description: data.description?.trim() || r.description,
          permissions: data.permissions !== undefined ? data.permissions : r.permissions,
          matrix: data.matrix !== undefined ? data.matrix : (r as any).matrix,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
  } else {
    // Override for system role
    roleOverrides[target.id] = {
      ...(roleOverrides[target.id] || {}),
      name: data.name?.trim() || target.name,
      description: data.description?.trim() || target.description,
      permissions: data.permissions !== undefined ? data.permissions : target.permissions,
      matrix: data.matrix !== undefined ? data.matrix : (target as any).matrix,
      updatedAt: new Date().toISOString(),
    };
  }

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: AUDIT_ACTION,
      details: JSON.stringify({
        customRoles,
        roleOverrides,
        lastUpdated: new Date().toISOString(),
      }),
    },
  });

  const updated = await getRoleById(roleId);
  return updated!;
}

/**
 * Deletes a custom role. System roles cannot be deleted.
 */
export async function deleteCustomRole(actorUserId: string, roleId: string): Promise<boolean> {
  const target = await getRoleById(roleId);
  if (!target) {
    throw new Error(`Role "${roleId}" not found.`);
  }
  if (!target.isCustom) {
    throw new Error(`System role "${target.name}" cannot be deleted.`);
  }

  const log = await prisma.auditLog.findFirst({
    where: { action: AUDIT_ACTION },
    orderBy: { createdAt: 'desc' },
    select: { details: true },
  });
  const currentDetails = log?.details ? JSON.parse(log.details) : {};
  const customRoles: RoleDefinition[] = (currentDetails.customRoles || []).filter(
    (r: any) => r.id.toUpperCase() !== roleId.toUpperCase()
  );
  const roleOverrides = currentDetails.roleOverrides || {};

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: AUDIT_ACTION,
      details: JSON.stringify({
        customRoles,
        roleOverrides,
        lastUpdated: new Date().toISOString(),
      }),
    },
  });

  return true;
}
