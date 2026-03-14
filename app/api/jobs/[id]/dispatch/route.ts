import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchMatch, computeDriverPickupRoutes } from '@/lib/primordia';
import type { JobContext } from '@/lib/primordia';

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

    // Transition to MATCHING
    await prisma.job.update({
      where: { id: params.id },
      data: { status: 'MATCHING' },
    });

    // Query all available drivers with full context
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

    // Build driver candidates with full profile context
    const rawCandidates = availableDrivers.map((d: typeof availableDrivers[number]) => ({
      id: d.id,
      name: d.user.name || 'Unknown Driver',
      currentLat: d.currentLat!,
      currentLng: d.currentLng!,
      rating: d.rating,
      totalJobs: d.totalJobs,
      vehicleType: d.vehicleType,
      subscriptionTier: d.subscriptionTier,
      serviceAreas: d.serviceAreas,
    }));

    // Step 1: Terra pre-routing — compute real road distance & ETA
    // from each driver to the pickup point
    const enrichedCandidates = await computeDriverPickupRoutes(
      rawCandidates,
      job.pickupLat,
      job.pickupLng
    );

    // Step 2: Primordia cognitive dispatch — evaluate all signals
    // and select the optimal driver
    const jobContext: JobContext = {
      pickupLat: job.pickupLat,
      pickupLng: job.pickupLng,
      dropoffLat: job.dropoffLat,
      dropoffLng: job.dropoffLng,
      packageSize: job.packageSize,
      urgency: job.urgency,
      pickupAddress: job.pickupAddress,
      dropoffAddress: job.dropoffAddress,
      description: job.description || undefined,
    };

    const matchResult = await dispatchMatch(jobContext, enrichedCandidates);

    // Step 3: Persist match result
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        status: 'MATCHED',
        driverId: matchResult.driverId,
        dispatchMatch: {
          driverId: matchResult.driverId,
          driverName: matchResult.driverName,
          confidence: matchResult.confidence,
          estimatedPickupTime: matchResult.estimatedPickupTime,
          reasoning: matchResult.reasoning,
          signals: matchResult.signals,
          candidatesEvaluated: enrichedCandidates.length,
          matchedAt: new Date().toISOString(),
        },
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
