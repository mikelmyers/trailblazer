export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db';
import { signUpSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
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
