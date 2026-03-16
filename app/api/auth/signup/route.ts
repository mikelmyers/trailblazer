export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db';
import { signUpSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/email';
import { getAuthRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
    try {
      const limiter = getAuthRateLimit();
      const { success } = await limiter.limit(`signup:${ip}`);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    } catch {
      // If rate limiter is unavailable, continue without it
    }

    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, role, companyName } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Return the same success message to prevent account enumeration
      return NextResponse.json(
        { message: 'Account created. Check your email to verify.' },
        { status: 201 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role,
      },
    });

    if (role === 'DRIVER') {
      await prisma.driver.create({
        data: {
          userId: user.id,
          vehicleType: 'CAR',
          serviceAreas: [],
        },
      });
    } else if (role === 'SHIPPER') {
      await prisma.shipper.create({
        data: {
          userId: user.id,
          companyName: companyName!,
        },
      });
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      },
    });

    await sendVerificationEmail(email.toLowerCase(), token);

    return NextResponse.json(
      { message: 'Account created. Check your email to verify.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
