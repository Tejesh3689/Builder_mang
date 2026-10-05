import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { requireAuth } from '@/lib/authorization';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if ((user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { firstName, lastName, email, role, password } = body;

    if (!firstName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'First name, email, role, and password are required.' },
        { status: 400 }
      );
    }

    const formattedEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role provided.' },
        { status: 400 }
      );
    }

    const assignedRole = role as UserRole;

    // Generate unique employee ID (EMP-XXX)
    const empCount = await prisma.employee.count();
    const employeeId = `EMP-${String(empCount + 1000).padStart(4, '0')}`;

    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        email: formattedEmail,
        passwordHash,
        role: assignedRole,
        isActive: true,
        employee: {
          create: {
            employeeId,
            firstName,
            lastName,
            designation: assignedRole,
            department: assignedRole === 'ADMIN' ? 'Management' : 'Operations',
          },
        },
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during admin user creation API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while creating user.' },
      { status: 500 }
    );
  }
}
