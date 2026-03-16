export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing verification token.' }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return NextResponse.json({ error: 'Verification token has expired. Please request a new one.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Mark email as verified and consume the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      }),
    ]);

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name ?? 'there');
    } catch {
      // Non-critical — don't fail verification if welcome email fails
    }

    // Redirect to signin with success message
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return Response.redirect(`${APP_URL}/auth/signin?verified=true`, 302);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
