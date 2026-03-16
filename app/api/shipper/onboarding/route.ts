export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, selectedTier } = body;

    if (!selectedTier) {
      return NextResponse.json({ error: 'Subscription tier is required.' }, { status: 400 });
    }

    const tier = selectedTier === 'GROWTH' ? 'GROWTH' : 'STARTER';

    // Upsert shipper profile — signup creates a bare profile, onboarding fills it in
    const existing = await prisma.shipper.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      await prisma.shipper.update({
        where: { userId: session.user.id },
        data: {
          ...(companyName && { companyName }),
          subscriptionTier: tier,
        },
      });
    } else {
      await prisma.shipper.create({
        data: {
          userId: session.user.id,
          companyName: companyName || null,
          subscriptionTier: tier,
        },
      });
    }

    // Update user role to SHIPPER if not already
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'SHIPPER' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Shipper onboarding error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
