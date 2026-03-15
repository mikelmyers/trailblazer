export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchMatch, computeDriverPickupRoutes } from '@/lib/primordia';
import type { JobContext } from '@/lib/primordia';
import { calculatePlatformFee, calculateShipperFee } from '@/lib/pricing';
import { createJobPaymentIntent, cancelJobPayment } from '@/lib/stripe';

/** Stripe manual-capture auth expires after 7 days */
const AUTH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

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
      include: { shipper: { select: { subscriptionTier: true } } },
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

    // Check for stale payment authorization (>7 days) and re-authorize
    if (job.paymentIntentId && job.paymentStatus === 'authorized' && job.priceCents) {
      const jobAge = Date.now() - new Date(job.createdAt).getTime();
      if (jobAge > AUTH_EXPIRY_MS) {
        const shipper = await prisma.shipper.findUnique({
          where: { id: job.shipperId },
          select: { stripeCustomerId: true },
        });

        if (shipper?.stripeCustomerId) {
          try {
            // Cancel the expired authorization
            await cancelJobPayment(job.paymentIntentId);

            // Create a new authorization
            const newPi = await createJobPaymentIntent(
              shipper.stripeCustomerId,
              job.priceCents,
              `job_reauth_${job.id}`,
            );

            await prisma.job.update({
              where: { id: job.id },
              data: { paymentIntentId: newPi.id, paymentStatus: 'authorized' },
            });

            await prisma.payment.updateMany({
              where: { jobId: job.id },
              data: { stripePaymentIntentId: newPi.id, status: 'authorized' },
            });

            // Update local reference for downstream use
            job.paymentIntentId = newPi.id;
          } catch (reAuthError) {
            console.error('Re-authorization failed:', reAuthError);
            return NextResponse.json(
              { error: 'Payment re-authorization failed. The shipper may need to update their payment method.' },
              { status: 402 },
            );
          }
        }
      }
    }

    // Transition to MATCHING
    await prisma.job.update({
      where: { id: params.id },
      data: { status: 'MATCHING' },
    });

    // Query all available drivers with full context
    // Prefer drivers with Connect onboarding complete, but also include
    // legacy drivers with active subscriptions (they can set up Connect later)
    const availableDrivers = await prisma.driver.findMany({
      where: {
        isAvailable: true,
        currentLat: { not: null },
        currentLng: { not: null },
        OR: [
          { stripeConnectOnboarded: true },
          { subscriptionStatus: 'active' },
        ],
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

    // Step 3: Calculate platform fee based on matched driver's tier
    const matchedDriver = availableDrivers.find((d: typeof availableDrivers[number]) => d.id === matchResult.driverId);
    const driverTier = matchedDriver?.subscriptionTier ?? 'FREE';

    let feeData: Record<string, unknown> = {};
    if (job.priceCents) {
      // Driver-side platform fee (based on driver subscription tier)
      const { platformFeeCents: driverFeeCents, driverPayoutCents, feePercent } = calculatePlatformFee(
        job.priceCents,
        driverTier,
      );

      // Shipper-side convenience fee (already baked into the PaymentIntent amount)
      const shipperTier = job.shipper?.subscriptionTier ?? 'STARTER';
      const { shipperFeeCents } = calculateShipperFee(job.priceCents, shipperTier);

      // Total platform revenue = driver-side fee + shipper convenience fee
      const totalPlatformFeeCents = driverFeeCents + shipperFeeCents;

      feeData = {
        platformFeeCents: totalPlatformFeeCents,
        driverPayoutCents,
        platformFeePercent: feePercent,
      };

      // Update Payment record with fee breakdown
      if (job.paymentIntentId) {
        await prisma.payment.updateMany({
          where: { jobId: job.id },
          data: {
            platformFeeCents: totalPlatformFeeCents,
            driverPayoutCents,
          },
        });
      }
    }

    // Step 4: Persist match result
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        status: 'MATCHED',
        driverId: matchResult.driverId,
        ...feeData,
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
