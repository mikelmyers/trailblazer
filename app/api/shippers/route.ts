import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
    const skip = (page - 1) * limit;

    // ADMIN: return all shippers with user info and filtering
    if (session.user.role === 'ADMIN') {
      const search = searchParams.get('search') ?? '';
      const tier = searchParams.get('tier') ?? '';

      const where: Record<string, unknown> = {};

      if (search.trim()) {
        where.companyName = {
          contains: search.trim(),
          mode: 'insensitive',
        };
      }

      if (tier && (tier === 'STARTER' || tier === 'GROWTH')) {
        where.subscriptionTier = tier;
      }

      const [shippers, total] = await Promise.all([
        prisma.shipper.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            companyName: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            monthlyJobCount: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        }),
        prisma.shipper.count({ where }),
      ]);

      return NextResponse.json({
        shippers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // SHIPPER: return own shipper profile only
    if (session.user.role === 'SHIPPER') {
      const shipper = await prisma.shipper.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          companyName: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          monthlyJobCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (!shipper) {
        return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
      }

      return NextResponse.json({
        shippers: [shipper],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
        },
      });
    }

    // Other roles: access denied
    return NextResponse.json(
      { error: 'Access denied. Admin or Shipper role required.' },
      { status: 403 }
    );
  } catch (error) {
    console.error('List shippers error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
