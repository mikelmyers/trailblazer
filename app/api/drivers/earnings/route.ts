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

    if (session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Only drivers can access earnings.' }, { status: 403 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
    }

    // Get all delivered jobs with payout data
    const deliveredJobs = await prisma.job.findMany({
      where: {
        driverId: driver.id,
        status: 'DELIVERED',
      },
      select: {
        id: true,
        priceCents: true,
        driverPayoutCents: true,
        platformFeeCents: true,
        deliveredAt: true,
      },
      orderBy: { deliveredAt: 'desc' },
    });

    // Calculate summaries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weekEarnings = 0;
    let monthEarnings = 0;
    let allTimeEarnings = 0;
    let weekJobs = 0;
    let monthJobs = 0;

    for (const job of deliveredJobs) {
      const payout = job.driverPayoutCents ?? job.priceCents ?? 0;
      allTimeEarnings += payout;

      if (job.deliveredAt && job.deliveredAt >= startOfWeek) {
        weekEarnings += payout;
        weekJobs++;
      }
      if (job.deliveredAt && job.deliveredAt >= startOfMonth) {
        monthEarnings += payout;
        monthJobs++;
      }
    }

    return NextResponse.json({
      weekEarnings,
      monthEarnings,
      allTimeEarnings,
      weekJobs,
      monthJobs,
      totalJobs: deliveredJobs.length,
    });
  } catch (error) {
    console.error('Earnings error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
