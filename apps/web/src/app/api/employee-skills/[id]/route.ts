import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireEmployeeInScope } from '@/lib/scope';
import { skillUpdateSchema } from '@/lib/validation/skill';

type Ctx = { params: Promise<{ id: string }> };

async function loadInScope(user: Awaited<ReturnType<typeof requireAuth>>, id: string) {
  const skill = await prisma.employeeSkill.findUnique({ where: { id } });
  if (!skill) throw notFound('Skill not found');
  await requireEmployeeInScope(user, skill.employeeId).catch(() => {
    throw notFound('Skill not found');
  });
  return skill;
}

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'skills:edit');
  const skill = await loadInScope(user, (await params).id);
  const input = await parseBody(req, skillUpdateSchema);

  const verification =
    input.verificationStatus === 'Verified'
      ? { verifiedBy: user.name, verificationDate: new Date() }
      : input.verificationStatus
        ? { verifiedBy: null, verificationDate: null }
        : {};

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.employeeSkill.update({ where: { id: skill.id }, data: { ...input, ...verification } });
    await recordAudit(tx, { userId: user.id, action: 'UPDATE_SKILL', details: { employeeId: skill.employeeId, skillId: skill.id, changes: input } });
    return row;
  });
  return ok(updated);
}, { resource: 'skill', context: 'employee skill PATCH' });

export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'skills:edit');
  const skill = await loadInScope(user, (await params).id);
  await prisma.$transaction(async (tx) => {
    await tx.employeeSkill.delete({ where: { id: skill.id } });
    await recordAudit(tx, { userId: user.id, action: 'DELETE_SKILL', details: { employeeId: skill.employeeId, skillId: skill.id, skill: skill.skill } });
  });
  return ok({ message: 'Employee skill deleted successfully.' });
}, { resource: 'skill', context: 'employee skill DELETE' });
