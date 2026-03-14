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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Build dispatch events from recent job state changes
    const recentJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        createdAt: true,
        matchedAt: true,
        deliveredAt: true,
        driver: {
          select: { user: { select: { name: true } } },
        },
        shipper: {
          select: { companyName: true },
        },
      },
    });

    const events = recentJobs.map((job: typeof recentJobs[number]) => {
      let type: string;
      let message: string;
      let timestamp: string;

      const driverName = job.driver?.user?.name || 'Unknown driver';
      const shipperName = job.shipper?.companyName || 'Unknown shipper';
      const shortId = job.id.slice(0, 8);

      switch (job.status) {
        case 'DELIVERED':
          type = 'COMPLETION';
          message = `${driverName} delivered job ${shortId} for ${shipperName}`;
          timestamp = job.deliveredAt?.toISOString() || job.createdAt.toISOString();
          break;
        case 'CANCELLED':
        case 'FAILED':
          type = 'CANCELLATION';
          message = `Job ${shortId} from ${shipperName} was ${job.status.toLowerCase()}`;
          timestamp = job.createdAt.toISOString();
          break;
        case 'MATCHED':
        case 'EN_ROUTE_PICKUP':
        case 'PICKED_UP':
        case 'EN_ROUTE_DROPOFF':
          type = 'DISPATCH';
          message = `${driverName} assigned to job ${shortId} (${job.pickupAddress} → ${job.dropoffAddress})`;
          timestamp = job.matchedAt?.toISOString() || job.createdAt.toISOString();
          break;
        default:
          type = 'SYSTEM';
          message = `Job ${shortId} posted by ${shipperName}`;
          timestamp = job.createdAt.toISOString();
          break;
      }

      return { id: job.id, type, message, timestamp };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Admin dispatch events error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
