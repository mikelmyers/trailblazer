export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '10', 10) || 10);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = { driverId: driver.id };

    if (statusFilter === 'ACTIVE') {
      where.status = { in: ['MATCHED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF'] };
    } else if (statusFilter === 'COMPLETED') {
      where.status = 'DELIVERED';
    } else if (statusFilter === 'CANCELLED') {
      where.status = { in: ['CANCELLED', 'FAILED'] };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Driver jobs error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
