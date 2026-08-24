import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const formattedEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default role to SITE_ENGINEER if not specified or invalid
    let assignedRole: UserRole = UserRole.SITE_ENGINEER;
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot self-register as ADMIN.' },
        { status: 403 }
      );
    }
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      assignedRole = role as UserRole;
    }

    // Create user and linked employee record in Neon database
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate unique employee ID (EMP-XXX)
    const empCount = await prisma.employee.count();
    const employeeId = `EMP-${String(empCount + 1).padStart(3, '0')}`;

    const newUser = await prisma.user.create({
      data: {
        name,
        email: formattedEmail,
        passwordHash,
        role: assignedRole,
        isActive: true,
        employee: {
          create: {
            employeeId,
            firstName,
            lastName,
            designation: assignedRole === 'ADMIN' ? 'Administrator' : 'Site Personnel',
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
        message: 'User registered successfully.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during registration API:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating user.' },
      { status: 500 }
    );
  }
}
