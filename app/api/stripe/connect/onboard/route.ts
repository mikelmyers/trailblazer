export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createConnectAccount, createAccountLink } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Only drivers can onboard to Connect.' }, { status: 403 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
    }

    let accountId = driver.stripeConnectAccountId;

    // Create Connect account if it doesn't exist
    if (!accountId) {
      const account = await createConnectAccount(
        driver.user.email,
        driver.user.name || undefined,
      );
      accountId = account.id;

      await prisma.driver.update({
        where: { id: driver.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    // Generate onboarding link
    const baseUrl = new URL(request.url).origin;

    const accountLink = await createAccountLink(
      accountId,
      `${baseUrl}/driver/onboarding?refresh=true`,
      `${baseUrl}/driver/onboarding?connect=complete`,
    );

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Connect onboard error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
