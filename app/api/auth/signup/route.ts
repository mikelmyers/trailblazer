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

    // Step 5: Create user, profile, and verification token in a transaction
    // This prevents orphaned records if any step fails
    step = 'database-transaction';
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await prisma.$transaction(async (tx) => {
      // Create user record
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          passwordHash,
          role,
        },
      });
      console.log(`[Signup] User created | userId=${user.id} | role=${role} | elapsed=${Date.now() - startTime}ms`);

      // Create role-specific profile
      if (role === 'DRIVER') {
        const driver = await tx.driver.create({
          data: {
            userId: user.id,
            vehicleType: 'CAR',
            serviceAreas: [],
          },
        });
        console.log(`[Signup] Driver profile created | driverId=${driver.id} | userId=${user.id}`);
      } else if (role === 'SHIPPER') {
        const shipper = await tx.shipper.create({
          data: {
            userId: user.id,
            companyName: companyName || null,
          },
        });
        console.log(`[Signup] Shipper profile created | shipperId=${shipper.id} | userId=${user.id} | companyName=${companyName || '(not provided)'}`);
      }

      // Create verification token
      await tx.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token,
          expires,
        },
      });
      console.log(`[Signup] Verification token created | email=${email.toLowerCase()}`);

      return user;
    });

    console.log(`[Signup] Transaction committed | userId=${result.id} | elapsed=${Date.now() - startTime}ms`);

    // Step 6: Send verification email (outside transaction — don't roll back the account if email fails)
    step = 'send-verification-email';
    try {
      await sendVerificationEmail(email.toLowerCase(), token);
      console.log(`[Signup] Verification email sent | email=${email.toLowerCase()} | totalElapsed=${Date.now() - startTime}ms`);
    } catch (emailError) {
      // Log the failure but don't fail the signup — user can request a resend
      console.error(`[Signup] Verification email FAILED | email=${email.toLowerCase()}`);
      console.error(`[Signup] Email error: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
      return NextResponse.json(
        { message: 'Account created, but we could not send the verification email. Please use "Resend verification email" to try again.' },
        { status: 201 }
      );
    }

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
