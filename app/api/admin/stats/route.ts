import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDrivers,
      driversOnline,
      activeJobs,
      jobsToday,
      deliveredThisMonth,
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { isAvailable: true } }),
      prisma.job.count({
        where: {
          status: {
            in: ['MATCHING', 'MATCHED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF'],
          },
        },
      }),
      prisma.job.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.job.count({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: startOfMonth },
        },
      }),
    ]);

    // Revenue estimate: deliveries this month * average job value
    const revenueThisMonth = deliveredThisMonth * 45;

    return NextResponse.json({
      totalDrivers,
      driversOnline,
      activeJobs,
      jobsToday,
      revenueThisMonth,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
