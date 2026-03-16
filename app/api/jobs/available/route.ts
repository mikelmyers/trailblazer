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

    const jobs = await prisma.job.findMany({
      where: { status: 'POSTED' },
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        urgency: true,
        packageSize: true,
        createdAt: true,
        deliveredAt: true,
        priceCents: true,
        driverPayoutCents: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Available jobs error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
