export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getConnectAccountStatus } from '@/lib/stripe';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
    }

    if (!driver.stripeConnectAccountId) {
      return NextResponse.json({
        onboarded: false,
        hasAccount: false,
      });
    }

    const status = await getConnectAccountStatus(driver.stripeConnectAccountId);

    const isOnboarded = status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted;

    // Update driver record if onboarding just completed
    if (isOnboarded && !driver.stripeConnectOnboarded) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { stripeConnectOnboarded: true },
      });
    }

    return NextResponse.json({
      onboarded: isOnboarded,
      hasAccount: true,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
    });
  } catch (error) {
    console.error('Connect status error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
