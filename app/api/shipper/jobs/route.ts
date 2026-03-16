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

    const shipper = await prisma.shipper.findUnique({
      where: { userId: session.user.id },
    });

    if (!shipper) {
      return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '10', 10) || 10);

    const where: Record<string, unknown> = { shipperId: shipper.id };

    if (status === 'active') {
      where.status = { in: ['POSTED', 'MATCHING', 'MATCHED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF'] };
    } else if (status === 'completed') {
      where.status = 'DELIVERED';
    }

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        pickupAddress: true,
        dropoffAddress: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
        driver: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        pickupAddress: job.pickupAddress,
        dropoffAddress: job.dropoffAddress,
        status: job.status,
        driverName: job.driver?.user?.name ?? null,
        createdAt: job.createdAt.toISOString(),
        updatedAt: (job.deliveredAt ?? job.createdAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error('Shipper jobs error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
