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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [todayDeliveries, weekEarningsResult] = await Promise.all([
      prisma.job.count({
        where: {
          driverId: driver.id,
          status: 'DELIVERED',
          deliveredAt: { gte: todayStart },
        },
      }),
      prisma.job.aggregate({
        where: {
          driverId: driver.id,
          status: 'DELIVERED',
          deliveredAt: { gte: weekStart },
        },
        _sum: { driverPayoutCents: true },
      }),
    ]);

    return NextResponse.json({
      todayDeliveries,
      weekEarnings: (weekEarningsResult._sum.driverPayoutCents ?? 0) / 100,
      rating: driver.rating,
      totalJobs: driver.totalJobs,
    });
  } catch (error) {
    console.error('Driver stats error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
