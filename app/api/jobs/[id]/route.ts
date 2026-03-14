import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateJobStatusSchema } from '@/lib/validations/job';
import { flagAnomaly } from '@/lib/primordia';

const VALID_TRANSITIONS: Record<string, string[]> = {
  POSTED: ['MATCHING', 'CANCELLED'],
  MATCHING: ['MATCHED', 'CANCELLED', 'FAILED'],
  MATCHED: ['EN_ROUTE_PICKUP', 'CANCELLED'],
  EN_ROUTE_PICKUP: ['PICKED_UP', 'CANCELLED', 'FAILED'],
  PICKED_UP: ['EN_ROUTE_DROPOFF', 'FAILED'],
  EN_ROUTE_DROPOFF: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        shipper: {
          select: { id: true, companyName: true, userId: true },
        },
        driver: {
          select: {
            id: true,
            userId: true,
            user: { select: { name: true } },
            vehicleType: true,
            rating: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isShipperOwner = job.shipper.userId === session.user.id;
    const isAssignedDriver = job.driver?.userId === session.user.id;

    if (!isAdmin && !isShipperOwner && !isAssignedDriver) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateJobStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status: newStatus } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        shipper: { select: { userId: true } },
        driver: { select: { id: true, userId: true, rating: true, totalJobs: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isShipperOwner = job.shipper.userId === session.user.id;
    const isAssignedDriver = job.driver?.userId === session.user.id;

    if (!isAdmin && !isShipperOwner && !isAssignedDriver) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const allowedTransitions = VALID_TRANSITIONS[job.status] ?? [];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${job.status} to ${newStatus}.` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    }

    if (newStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedJob = await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id: params.id },
        data: updateData,
      });

      if (newStatus === 'DELIVERED' && job.driver) {
        await flagAnomaly(job.id, 'DELIVERY_COMPLETED', {
          driverId: job.driver.id,
          pickupLat: job.pickupLat,
          pickupLng: job.pickupLng,
          dropoffLat: job.dropoffLat,
          dropoffLng: job.dropoffLng,
          deliveredAt: new Date().toISOString(),
        });

        const newTotalJobs = job.driver.totalJobs + 1;
        const newRating =
          (job.driver.rating * job.driver.totalJobs + 5) / newTotalJobs;

        await tx.driver.update({
          where: { id: job.driver.id },
          data: {
            totalJobs: newTotalJobs,
            rating: Math.round(newRating * 100) / 100,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
