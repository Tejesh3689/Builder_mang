import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { conflict } from '@/lib/http/errors';
import { apiHandler, created } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { optionalText, requiredText } from '@/lib/validation/common';
import { assertUniqueContact, nextEmployeeCode } from '@/services/employee.service';

const createUserSchema = z.object({
  firstName: requiredText('firstName', 100),
  lastName: optionalText('lastName', 100),
  email: z
    .string({ required_error: 'email is required', invalid_type_error: 'email must be a string' })
    .trim()
    .toLowerCase()
    .max(254, 'email must be at most 254 characters')
    .email('email must be a valid email address'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: `role must be one of: ${Object.values(UserRole).join(', ')}` }) }),
  password: z
    .string({ required_error: 'password is required', invalid_type_error: 'password must be a string' })
    .min(6, 'Password must be at least 6 characters long.')
    // bcrypt only uses the first 72 bytes and login rejects longer passwords.
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password must be at most 72 bytes long.'),
});

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'admin:users'); // ADMIN only
  const input = await parseBody(req, createUserSchema);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const newUser = await prisma.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
      throw conflict('User with this email already exists.', { field: 'email' });
    }
    await assertUniqueContact(tx, { email: input.email });

    const row = await tx.user.create({
      data: {
        name: `${input.firstName} ${input.lastName ?? ''}`.trim(),
        email: input.email,
        passwordHash,
        role: input.role,
        isActive: true,
        employee: {
          create: {
            employeeId: await nextEmployeeCode(tx),
            firstName: input.firstName,
            lastName: input.lastName ?? '',
            email: input.email,
            designation: input.role,
            department: input.role === 'ADMIN' ? 'Management' : 'Operations',
          },
        },
      },
    });
    await recordAudit(tx, { userId: user.id, action: 'CREATE_USER', details: { userId: row.id, role: row.role } });
    return row;
  });

  return created({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
}, { resource: 'user', context: 'admin users POST' });
