export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20));
    const status = searchParams.get('status') || undefined;
    const urgency = searchParams.get('urgency') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      where.createdAt = createdAt;
    }

    const skip = (page - 1) * pageSize;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: { select: { id: true, companyName: true } },
          driver: { select: { id: true, user: { select: { name: true } } } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const mapped = jobs.map((job) => ({
      id: job.id,
      shipperName: job.shipper.companyName,
      driverName: job.driver?.user?.name ?? null,
      status: job.status,
      urgency: job.urgency,
      pickupAddress: job.pickupAddress,
      dropoffAddress: job.dropoffAddress,
      createdAt: job.createdAt.toISOString(),
    }));

    return NextResponse.json({
      jobs: mapped,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Admin list jobs error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
