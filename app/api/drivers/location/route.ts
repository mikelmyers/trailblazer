import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateLocationSchema } from '@/lib/validations/drivers';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (session.user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: 'Only drivers can update location.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentLat, currentLng } = parsed.data;

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLat,
        currentLng,
        lastLocationAt: new Date(),
      },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
      },
    });

    return NextResponse.json({ driver: updatedDriver });
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
