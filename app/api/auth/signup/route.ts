export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db';
import { signUpSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  const startTime = Date.now();
  let step = 'init';

  try {
    // Step 1: Parse request body
    step = 'parse-body';
    const body = await request.json();
    console.log(`[Signup] Step: ${step} | role=${body.role} | email=${body.email} | hasCompanyName=${!!body.companyName}`);

    // Step 2: Validate input
    step = 'validate-input';
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      console.warn(`[Signup] Validation failed | errors=${JSON.stringify(fieldErrors)}`);
      return NextResponse.json(
        { error: 'Invalid input.', details: fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, role, companyName } = parsed.data;
    console.log(`[Signup] Validation passed | role=${role} | email=${email.toLowerCase()}`);

    // Step 3: Check for existing user
    step = 'check-existing-user';
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      console.warn(`[Signup] Duplicate email | email=${email.toLowerCase()}`);
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Step 4: Hash password
    step = 'hash-password';
    const passwordHash = await bcrypt.hash(password, 12);
    console.log(`[Signup] Password hashed | elapsed=${Date.now() - startTime}ms`);

    // Step 5: Create user record
    step = 'create-user';
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role,
      },
    });
    console.log(`[Signup] User created | userId=${user.id} | role=${role} | elapsed=${Date.now() - startTime}ms`);

    // Step 6: Create role-specific profile
    step = `create-${role.toLowerCase()}-profile`;
    if (role === 'DRIVER') {
      const driver = await prisma.driver.create({
        data: {
          userId: user.id,
          vehicleType: 'CAR',
          serviceAreas: [],
        },
      });
      console.log(`[Signup] Driver profile created | driverId=${driver.id} | userId=${user.id}`);
    } else if (role === 'SHIPPER') {
      const shipper = await prisma.shipper.create({
        data: {
          userId: user.id,
          companyName: companyName!,
        },
      });
      console.log(`[Signup] Shipper profile created | shipperId=${shipper.id} | userId=${user.id} | companyName=${companyName}`);
    }

    // Step 7: Create verification token
    step = 'create-verification-token';
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      },
    });
    console.log(`[Signup] Verification token created | email=${email.toLowerCase()}`);

    // Step 8: Send verification email
    step = 'send-verification-email';
    await sendVerificationEmail(email.toLowerCase(), token);
    console.log(`[Signup] Verification email sent | email=${email.toLowerCase()} | totalElapsed=${Date.now() - startTime}ms`);

    return NextResponse.json(
      { message: 'Account created. Check your email to verify.' },
      { status: 201 }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[Signup] FAILED at step="${step}" | elapsed=${elapsed}ms`);
    console.error(`[Signup] Error name: ${error instanceof Error ? error.name : 'unknown'}`);
    console.error(`[Signup] Error message: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(`[Signup] Stack trace: ${error.stack}`);
    }
    return NextResponse.json(
      { error: `Something went wrong during account creation (step: ${step}). Please try again.` },
      { status: 500 }
    );
  }
}
