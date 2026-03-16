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

    if (!companyName || !selectedTier) {
      return NextResponse.json({ error: 'Company name and tier are required.' }, { status: 400 });
    }

    // Check if shipper profile already exists
    const existing = await prisma.shipper.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ error: 'Shipper profile already exists.' }, { status: 409 });
    }

    await prisma.shipper.create({
      data: {
        userId: session.user.id,
        companyName,
        subscriptionTier: selectedTier === 'GROWTH' ? 'GROWTH' : 'STARTER',
      },
    });

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
