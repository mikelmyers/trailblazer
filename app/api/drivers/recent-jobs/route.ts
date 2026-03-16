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
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '5', 10) || 5);

    const jobs = await prisma.job.findMany({
      where: { driverId: driver.id },
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        deliveredAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Driver recent jobs error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
