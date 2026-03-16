export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const role = session.user.role;

    if (role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
        select: { subscriptionTier: true },
      });
      return NextResponse.json({ tier: driver?.subscriptionTier ?? 'FREE' });
    }

    if (role === 'SHIPPER') {
      const shipper = await prisma.shipper.findUnique({
        where: { userId: session.user.id },
        select: { subscriptionTier: true },
      });
      return NextResponse.json({ tier: shipper?.subscriptionTier ?? 'CASUAL' });
    }

    if (role === 'ADMIN') {
      return NextResponse.json({ tier: 'ENTERPRISE' });
    }

    return NextResponse.json({ tier: null });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
