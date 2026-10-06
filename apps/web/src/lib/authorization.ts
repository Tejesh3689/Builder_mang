import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UserRole } from '@prisma/client';
import { hasPermission } from './permissions';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // RE-VALIDATE Session against Database
  const freshUser = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });

  if (!freshUser || !freshUser.isActive) {
    throw new Error('Unauthorized');
  }

  return freshUser; // Return fresh trusted state
}

export async function requirePermission(permission: string) {
  const user = await requireAuth();
  
  // Enforce existing permission rules securely
  if (!hasPermission((user as any).role as UserRole, permission)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

import prisma from '@/lib/db';

export async function buildDataScope(user: any) {
  // Translate legacy roles dynamically during Phase 1
  const role = user.role === 'MANAGER' ? 'MANAGER' : 
               user.role === 'SUPERVISOR' ? 'SUPERVISOR' : user.role;

  if (role === 'ADMIN') return {}; // Full access
  
  if (role === 'MANAGER') {
    // Manager scope: operates on ventures
    return { scope: 'VENTURE_LEVEL', identifier: user.id }; 
  }
  
  if (role === 'SUPERVISOR') {
    // Supervisor scope: strictly their direct reports using the relational reportingManagerId
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    
    if (!employee) {
      // If the supervisor has no linked Employee record, they have no team
      return { scope: 'TEAM_LEVEL', identifier: 'NO_EMPLOYEE_RECORD' };
    }
    
    return { scope: 'TEAM_LEVEL', identifier: employee.id }; 
  }
  
  // SELF scope needs employee ID if we want to filter by employee
  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });
  
  return { scope: 'SELF', identifier: employee?.id || user.id };
}

/**
 * Builds a Prisma `where` clause object ensuring the user only accesses their scoped data.
 * @param user The authenticated user object
 * @param resourceType Which relation to check (e.g. 'venture', 'employee', 'materialRequest')
 */
export async function buildScopedWhere(user: any, resourceType: 'venture' | 'employee' | 'materialRequest' | 'attendance' | 'leave') {
  const scopeInfo = await buildDataScope(user);

  if (scopeInfo.scope === 'VENTURE_LEVEL') {
    // Get all ventures the manager is assigned to
    const assignments = await prisma.employeeVentureAssignment.findMany({
      where: { employee: { userId: user.id }, status: 'ACTIVE' },
      select: { ventureId: true }
    });
    const ventureIds = assignments.map(a => a.ventureId);

    if (resourceType === 'venture') return { id: { in: ventureIds } };
    if (resourceType === 'employee') return { assignments: { some: { ventureId: { in: ventureIds }, status: 'ACTIVE' } } };
    if (resourceType === 'materialRequest') return { ventureId: { in: ventureIds } };
    if (resourceType === 'attendance') return { employee: { assignments: { some: { ventureId: { in: ventureIds }, status: 'ACTIVE' } } } };
    if (resourceType === 'leave') return { employee: { assignments: { some: { ventureId: { in: ventureIds }, status: 'ACTIVE' } } } };
  }

  if (scopeInfo.scope === 'TEAM_LEVEL') {
    if (resourceType === 'venture') return { id: 'DENY_ALL' }; // Supervisors shouldn't list all ventures broadly without restriction
    if (resourceType === 'employee') return { reportingManagerId: scopeInfo.identifier };
    if (resourceType === 'attendance') return { employee: { reportingManagerId: scopeInfo.identifier } };
    if (resourceType === 'leave') return { employee: { reportingManagerId: scopeInfo.identifier } };
    // materialRequests for supervisors might be restricted to ventures they are assigned to.
    const assignments = await prisma.employeeVentureAssignment.findMany({
      where: { employeeId: scopeInfo.identifier as string, status: 'ACTIVE' },
      select: { ventureId: true }
    });
    const ventureIds = assignments.map(a => a.ventureId);
    if (resourceType === 'materialRequest') return { ventureId: { in: ventureIds } };
  }

  if (scopeInfo.scope === 'SELF') {
    if (resourceType === 'employee') return { userId: user.id };
    if (resourceType === 'attendance') return { employeeId: scopeInfo.identifier };
    if (resourceType === 'leave') return { employeeId: scopeInfo.identifier };
    if (resourceType === 'materialRequest') return { createdById: user.id };
    if (resourceType === 'venture') return { id: 'DENY_ALL' };
  }

  // ADMIN or fallback
  if (scopeInfo.scope === undefined && user.role === 'ADMIN') return {};
  
  // Default deny if unmapped
  return { id: 'DENY_ALL' };
}

