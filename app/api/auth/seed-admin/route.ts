import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * One-time admin seed endpoint.
 * POST /api/auth/seed-admin
 * Body: { email, password, secret }
 *
 * The `secret` must match NEXTAUTH_SECRET to prevent unauthorized use.
 * Remove this route after seeding your admin account.
 */
export async function POST(req: Request) {
  try {
    const { email, password, secret } = await req.json();

    // Protect with NEXTAUTH_SECRET
    if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Update existing user: set password hash, ensure emailVerified, set ADMIN role
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: 'ADMIN',
          emailVerified: existing.emailVerified ?? new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      return NextResponse.json({ message: `Updated existing user ${email} to ADMIN with new password.` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: 'Admin',
        role: 'ADMIN',
        passwordHash,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ message: `Admin user created: ${email}` });
  } catch (err: any) {
    console.error('seed-admin error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
