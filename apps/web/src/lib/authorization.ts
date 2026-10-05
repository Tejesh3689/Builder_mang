import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UserRole } from '@prisma/client';
import { hasPermission } from './permissions';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
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
  const role = user.role === 'PROJECT_MANAGER' ? 'MANAGER' : 
               user.role === 'SITE_ENGINEER' ? 'SUPERVISOR' : user.role;

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
