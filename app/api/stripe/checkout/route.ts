import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, createCheckoutSession } from '@/lib/stripe';
import { checkoutSchema } from '@/lib/validations/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { priceId } = parsed.data;
    let stripeCustomerId: string | null = null;

    if (session.user.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
        select: { stripeCustomerId: true },
      });

      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
      }

      stripeCustomerId = driver.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name ?? undefined,
          metadata: {
            userId: session.user.id,
            role: 'DRIVER',
          },
        });

        await prisma.driver.update({
          where: { userId: session.user.id },
          data: { stripeCustomerId: customer.id },
        });

        stripeCustomerId = customer.id;
      }
    } else if (session.user.role === 'SHIPPER') {
      const shipper = await prisma.shipper.findUnique({
        where: { userId: session.user.id },
        select: { stripeCustomerId: true },
      });

      if (!shipper) {
        return NextResponse.json({ error: 'Shipper profile not found.' }, { status: 404 });
      }

      stripeCustomerId = shipper.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name ?? undefined,
          metadata: {
            userId: session.user.id,
            role: 'SHIPPER',
          },
        });

        await prisma.shipper.update({
          where: { userId: session.user.id },
          data: { stripeCustomerId: customer.id },
        });

        stripeCustomerId = customer.id;
      }
    } else {
      return NextResponse.json({ error: 'Invalid role for subscription.' }, { status: 400 });
    }

    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${APP_URL}/dashboard/billing?success=true`,
      `${APP_URL}/dashboard/billing?canceled=true`
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
