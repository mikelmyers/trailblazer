import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCustomerPortalSession } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let stripeCustomerId: string | null = null;

    if (session.user.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
        select: { stripeCustomerId: true },
      });
      stripeCustomerId = driver?.stripeCustomerId ?? null;
    } else if (session.user.role === 'SHIPPER') {
      const shipper = await prisma.shipper.findUnique({
        where: { userId: session.user.id },
        select: { stripeCustomerId: true },
      });
      stripeCustomerId = shipper?.stripeCustomerId ?? null;
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      );
    }

    const portalSession = await createCustomerPortalSession(
      stripeCustomerId,
      `${APP_URL}/dashboard/billing`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
