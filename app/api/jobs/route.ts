export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createJobSchema, jobQuerySchema } from '@/lib/validations/job';
import { optimizeRoute } from '@/lib/primordia';
import { calculateSuggestedPrice, calculateShipperFee, SHIPPER_JOB_LIMITS } from '@/lib/pricing';
import { createJobPaymentIntent } from '@/lib/stripe';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = jobQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 20,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters.' }, { status: 400 });
    }

    const { status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (session.user.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
      });

      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
      }

      where.OR = [
        { status: 'POSTED' },
        { driverId: driver.id },
      ];
    } else if (session.user.role === 'SHIPPER') {
      const shipper = await prisma.shipper.findUnique({
        where: { userId: session.user.id },
      });

      if (!shipper) {
        return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
      }

      where.shipperId = shipper.id;
    }
    // ADMIN sees all -- no additional filter

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: { select: { id: true, companyName: true } },
          driver: { select: { id: true, user: { select: { name: true } }, vehicleType: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (session.user.role !== 'SHIPPER') {
      return NextResponse.json({ error: 'Only shippers can create jobs.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const shipper = await prisma.shipper.findUnique({
      where: { userId: session.user.id },
    });

    if (!shipper) {
      return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
    }

    // CASUAL tier is pay-per-use (no subscription required).
    // Starter and Growth require an active subscription.
    if (shipper.subscriptionTier !== 'CASUAL') {
      if (!shipper.subscriptionStatus || shipper.subscriptionStatus !== 'active') {
        return NextResponse.json(
          { error: 'An active subscription is required to create jobs.' },
          { status: 403 }
        );
      }
    }

    const jobLimit = SHIPPER_JOB_LIMITS[shipper.subscriptionTier] ?? null;
    if (jobLimit !== null && shipper.monthlyJobCount >= jobLimit) {
      return NextResponse.json(
        { error: `Monthly job limit (${jobLimit}) reached. Upgrade your plan for more jobs.` },
        { status: 403 }
      );
    }

    const {
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      description,
      packageSize,
      urgency,
      priceCents,
    } = parsed.data;

    const estimatedRoute = await optimizeRoute(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    );

    // Calculate suggested price for analytics
    const priceSuggestion = calculateSuggestedPrice({
      distanceKm: estimatedRoute.distance,
      durationMin: estimatedRoute.duration,
      packageSize,
      urgency,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    });

    // Calculate shipper convenience fee (CASUAL tier pays 8% on top)
    const { shipperFeeCents, totalChargeCents } = calculateShipperFee(
      priceCents,
      shipper.subscriptionTier,
    );

    // Create Stripe PaymentIntent (authorize only, capture on delivery)
    // Charge includes the shipper convenience fee on top of the job price
    let paymentIntentId: string | null = null;
    let paymentStatus: string = 'pending';

    if (shipper.stripeCustomerId) {
      try {
        const pi = await createJobPaymentIntent(
          shipper.stripeCustomerId,
          totalChargeCents,
          `job_${Date.now()}`,
        );
        paymentIntentId = pi.id;
        paymentStatus = 'authorized';
      } catch (err) {
        console.error('Payment authorization failed:', err);
        return NextResponse.json(
          { error: 'Payment authorization failed. Please check your payment method.' },
          { status: 402 },
        );
      }
    }

    const job = await prisma.// eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction(async (tx: any) => {
      const createdJob = await tx.job.create({
        data: {
          shipperId: shipper.id,
          status: 'POSTED',
          pickupAddress,
          pickupLat,
          pickupLng,
          dropoffAddress,
          dropoffLat,
          dropoffLng,
          description,
          packageSize,
          urgency,
          estimatedRoute: estimatedRoute as unknown as Record<string, unknown>,
          priceCents,
          suggestedPriceCents: priceSuggestion.suggestedPriceCents,
          pricingBreakdown: priceSuggestion.breakdown as unknown as Record<string, unknown>,
          paymentIntentId,
          paymentStatus,
        },
      });

      // Create Payment record if PaymentIntent was created
      if (paymentIntentId) {
        await tx.payment.create({
          data: {
            jobId: createdJob.id,
            stripePaymentIntentId: paymentIntentId,
            amountCents: totalChargeCents,
            platformFeeCents: shipperFeeCents, // shipper fee known upfront; driver fee added at match
            driverPayoutCents: 0, // calculated at match time
            status: 'authorized',
          },
        });
      }

      await tx.shipper.update({
        where: { id: shipper.id },
        data: { monthlyJobCount: { increment: 1 } },
      });

      return createdJob;
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
