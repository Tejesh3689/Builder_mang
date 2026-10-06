import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid input format.' }, { status: 400 });
    }

    const { name, email, password, role } = body;

    if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input data.' },
        { status: 400 }
      );
    }

    const formattedEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Invalid input data.' },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      return NextResponse.json(
        { error: 'Password exceeds maximum allowed length of 72 bytes.' },
        { status: 400 }
      );
    }

    // Check if user already exists (some implementations leak this, but to be strictly safe we can just say "User registered" and not create it, but standard 409 is often acceptable for register. However, I'll keep 409 but change the text if needed. Actually, let's just return 400 for any issue.)
    const existingUser = await prisma.user.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Registration failed.' }, // Generic message to obscure state
        { status: 400 }
      );
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Hardcode a safe default role. IGNORE the client-provided role entirely.
    const assignedRole: UserRole = UserRole.SUPERVISOR;

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
            designation: 'Site Personnel',
            department: 'Operations',
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
