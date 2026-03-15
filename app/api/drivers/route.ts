export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { driverQuerySchema } from '@/lib/validations/drivers';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    let isGrowthShipper = false;

    if (session.user.role === 'SHIPPER') {
      const shipper = await prisma.shipper.findUnique({
        where: { userId: session.user.id },
        select: { subscriptionTier: true, subscriptionStatus: true },
      });

      if (shipper?.subscriptionTier === 'GROWTH' && shipper.subscriptionStatus === 'active') {
        isGrowthShipper = true;
      }
    }

    if (!isAdmin && !isGrowthShipper) {
      return NextResponse.json(
        { error: 'Access denied. Admin or Growth tier shipper required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = driverQuerySchema.safeParse({
      availability: searchParams.get('availability') ?? undefined,
      vehicleType: searchParams.get('vehicleType') ?? undefined,
      serviceArea: searchParams.get('serviceArea') ?? undefined,
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 20,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters.' }, { status: 400 });
    }

    const { availability, vehicleType, serviceArea, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (availability !== undefined) {
      where.isAvailable = availability === 'true';
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    if (serviceArea) {
      where.serviceAreas = { has: serviceArea };
    }

    const selectFields = isAdmin
      ? {
          id: true,
          vehicleType: true,
          serviceAreas: true,
          isAvailable: true,
          currentLat: true,
          currentLng: true,
          lastLocationAt: true,
          rating: true,
          totalJobs: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        }
      : {
          id: true,
          vehicleType: true,
          serviceAreas: true,
          isAvailable: true,
          rating: true,
          totalJobs: true,
          user: { select: { name: true, image: true } },
        };

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
        select: selectFields,
      }),
      prisma.driver.count({ where }),
    ]);

    return NextResponse.json({
      drivers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List drivers error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
