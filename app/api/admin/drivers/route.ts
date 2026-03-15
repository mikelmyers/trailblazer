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
    const availability = searchParams.get('availability') || undefined;
    const tier = searchParams.get('tier') || undefined;
    const vehicleType = searchParams.get('vehicleType') || undefined;

    const where: Record<string, unknown> = {};
    if (availability === 'ONLINE') where.isAvailable = true;
    if (availability === 'OFFLINE') where.isAvailable = false;
    if (tier) where.subscriptionTier = tier;
    if (vehicleType) where.vehicleType = vehicleType;

    const skip = (page - 1) * pageSize;

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
        },
      }),
      prisma.driver.count({ where }),
    ]);

    const mapped = drivers.map((driver) => ({
      id: driver.id,
      name: driver.user.name ?? 'Unknown',
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.serviceAreas[0] ?? '',
      isOnline: driver.isAvailable,
      tier: driver.subscriptionTier,
      rating: driver.rating,
      totalJobs: driver.totalJobs,
      lastActive: (driver.lastLocationAt ?? driver.createdAt).toISOString(),
    }));

    return NextResponse.json({
      drivers: mapped,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Admin list drivers error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
