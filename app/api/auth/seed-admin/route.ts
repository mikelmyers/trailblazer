import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * One-time admin seed endpoint — works from a phone browser.
 *
 * Visit in your browser:
 *   https://your-site.vercel.app/api/auth/seed-admin?secret=YOUR_NEXTAUTH_SECRET
 *
 * This will create (or fix) the admin user with:
 *   Email:    admin@trailblazer.local
 *   Password: Admin123!@#secure
 *
 * REMOVE THIS ROUTE after you have seeded the admin.
 */

const ADMIN_EMAIL = 'admin@trailblazer.local';
const ADMIN_PASSWORD = 'Admin123!@#secure';

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');

    if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized — pass ?secret=YOUR_NEXTAUTH_SECRET' }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          passwordHash,
          role: 'ADMIN',
          emailVerified: existing.emailVerified ?? new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      return NextResponse.json({
        success: true,
        message: `Fixed existing admin user.`,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        note: 'You can now sign in. REMOVE this route after logging in.',
      });
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: 'Admin',
        role: 'ADMIN',
        passwordHash,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin user created.`,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      note: 'You can now sign in. REMOVE this route after logging in.',
    });
  } catch (err: any) {
    console.error('seed-admin error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
