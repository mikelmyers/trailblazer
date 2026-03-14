import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tier = searchParams.get('tier');
    const skip = (page - 1) * limit;

    if (session.user.role === 'ADMIN') {
      const where: Record<string, unknown> = {};
      if (tier) where.subscriptionTier = tier;

      const [shippers, total] = await Promise.all([
        prisma.shipper.findMany({
          where,
          include: {
            user: {
              select: { id: true, email: true, name: true, createdAt: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.shipper.count({ where }),
      ]);

      return NextResponse.json({
        shippers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    if (session.user.role === 'SHIPPER') {
      const shipper = await prisma.shipper.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      if (!shipper) {
        return NextResponse.json({ error: 'Shipper profile not found' }, { status: 404 });
      }

      return NextResponse.json({ shipper });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
