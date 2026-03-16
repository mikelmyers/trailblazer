export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const shipper = await prisma.shipper.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { email: true } } },
    });

    if (!shipper) {
      return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      companyName: shipper.companyName,
      contactEmail: shipper.user.email,
      defaultPackageSize: 'SMALL',
      defaultUrgency: 'STANDARD',
      defaultSpecialInstructions: '',
    });
  } catch (error) {
    console.error('Shipper profile error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const shipper = await prisma.shipper.findUnique({
      where: { userId: session.user.id },
    });

    if (!shipper) {
      return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
    }

    const body = await request.json();

    const companyName = body.companyName;
    if (companyName !== undefined) {
      if (typeof companyName !== 'string' || companyName.trim().length < 2 || companyName.trim().length > 200) {
        return NextResponse.json({ error: 'Company name must be between 2 and 200 characters.' }, { status: 400 });
      }
    }

    await prisma.shipper.update({
      where: { id: shipper.id },
      data: {
        companyName: companyName ? companyName.trim() : shipper.companyName,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Shipper profile update error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
