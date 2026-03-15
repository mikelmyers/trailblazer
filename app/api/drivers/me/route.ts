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
      include: { user: { select: { name: true, email: true, image: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
    }

    // Find active job for this driver
    const activeJob = await prisma.job.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['MATCHED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF'] },
      },
      select: { id: true },
    });

    return NextResponse.json({
      id: driver.id,
      userName: driver.user.name ?? '',
      email: driver.user.email,
      image: driver.user.image,
      isAvailable: driver.isAvailable,
      vehicleType: driver.vehicleType,
      serviceAreas: driver.serviceAreas,
      rating: driver.rating,
      totalJobs: driver.totalJobs,
      subscriptionTier: driver.subscriptionTier,
      subscriptionStatus: driver.subscriptionStatus,
      stripeConnectOnboarded: driver.stripeConnectOnboarded,
      activeJobId: activeJob?.id ?? null,
    });
  } catch (error) {
    console.error('Driver me error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
