import { z } from 'zod';
import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireEmployeeInScope } from '@/lib/scope';
import { requiredText } from '@/lib/validation/common';
import { skillFields } from '@/lib/validation/skill';

type Ctx = { params: Promise<{ id: string }> };

const skillCreateSchema = z.object({
  skill: requiredText('skill', 100),
  category: skillFields.category.default('Civil'),
  proficiency: skillFields.proficiency.default('Intermediate'),
  experienceYears: skillFields.experienceYears.default(0),
});

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const employee = await requireEmployeeInScope(user, (await params).id);
  const skills = await prisma.employeeSkill.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
  });
  return ok(skills);
}, { resource: 'skill', context: 'employee skills GET' });

export const POST = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'skills:edit');
  const employee = await requireEmployeeInScope(user, (await params).id);
  const input = await parseBody(req, skillCreateSchema);
  const skill = await prisma.$transaction(async (tx) => {
    const row = await tx.employeeSkill.create({ data: { employeeId: employee.id, ...input } });
    await recordAudit(tx, { userId: user.id, action: 'ADD_SKILL', details: { employeeId: employee.id, skillId: row.id, skill: row.skill } });
    return row;
  });
  return created(skill);
}, { resource: 'skill', context: 'employee skills POST' });
