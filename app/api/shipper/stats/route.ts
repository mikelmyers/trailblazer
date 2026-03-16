export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SHIPPER_JOB_LIMITS } from '@/lib/pricing';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const shipper = await prisma.shipper.findUnique({
      where: { userId: session.user.id },
    });

    if (!shipper) {
      return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
    }

    const [activeJobs, jobsThisMonth, avgRating] = await Promise.all([
      prisma.job.count({
        where: {
          shipperId: shipper.id,
          status: { in: ['POSTED', 'MATCHING', 'MATCHED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF'] },
        },
      }),
      prisma.job.count({
        where: {
          shipperId: shipper.id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.job.aggregate({
        where: {
          shipperId: shipper.id,
          shipperRating: { not: null },
        },
        _avg: { shipperRating: true },
      }),
    ]);

    return NextResponse.json({
      activeJobs,
      jobsThisMonth,
      monthlyLimit: SHIPPER_JOB_LIMITS[shipper.subscriptionTier] ?? null,
      averageRating: avgRating._avg.shipperRating ?? 0,
      tier: shipper.subscriptionTier,
    });
  } catch (error) {
    console.error('Shipper stats error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
