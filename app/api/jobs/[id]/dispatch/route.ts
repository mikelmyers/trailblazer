import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchMatch } from '@/lib/primordia';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can trigger dispatch.' },
        { status: 403 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    if (job.status !== 'POSTED') {
      return NextResponse.json(
        { error: 'Job must be in POSTED status to dispatch.' },
        { status: 400 }
      );
    }

    await prisma.job.update({
      where: { id: params.id },
      data: { status: 'MATCHING' },
    });

    const availableDrivers = await prisma.driver.findMany({
      where: {
        isAvailable: true,
        currentLat: { not: null },
        currentLng: { not: null },
        subscriptionStatus: 'active',
      },
      include: {
        user: { select: { name: true } },
      },
    });

    if (availableDrivers.length === 0) {
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'POSTED' },
      });

      return NextResponse.json(
        { error: 'No available drivers found.' },
        { status: 404 }
      );
    }

    const driverCandidates = availableDrivers.map((d) => ({
      id: d.id,
      currentLat: d.currentLat!,
      currentLng: d.currentLng!,
      rating: d.rating,
      vehicleType: d.vehicleType,
    }));

    const matchResult = await dispatchMatch(
      job.pickupLat,
      job.pickupLng,
      job.dropoffLat,
      job.dropoffLng,
      job.packageSize,
      job.urgency,
      driverCandidates
    );

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        status: 'MATCHED',
        driverId: matchResult.driverId,
        dispatchMatch: matchResult as unknown as Record<string, unknown>,
        matchedAt: new Date(),
      },
    });

    return NextResponse.json({ job: updatedJob, match: matchResult });
  } catch (error) {
    console.error('Dispatch error:', error);

    // Revert to POSTED if dispatch fails mid-process
    try {
      await prisma.job.update({
        where: { id: params.id },
        data: { status: 'POSTED' },
      });
    } catch {
      // Best effort revert
    }

    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
