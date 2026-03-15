export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateAvailabilitySchema } from '@/lib/validations/drivers';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (session.user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: 'Only drivers can update availability.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateAvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { isAvailable } = parsed.data;

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
    }

    if (isAvailable && driver.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'An active subscription is required to go online.' },
        { status: 403 }
      );
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: { isAvailable },
      select: {
        id: true,
        isAvailable: true,
      },
    });

    return NextResponse.json({ driver: updatedDriver });
  } catch (error) {
    console.error('Update availability error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
