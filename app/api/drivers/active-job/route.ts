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

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
    }

    const job = await prisma.job.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['MATCHED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF'] },
      },
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        pickupLat: true,
        pickupLng: true,
        dropoffLat: true,
        dropoffLng: true,
        urgency: true,
        packageSize: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ job: job ?? null });
  } catch (error) {
    console.error('Driver active job error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
