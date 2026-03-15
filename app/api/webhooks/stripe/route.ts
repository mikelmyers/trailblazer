export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function getTierFromPriceId(priceId: string): { role: 'DRIVER' | 'SHIPPER'; tier: string } | null {
  if (PRICE_IDS.DRIVER_FREE && priceId === PRICE_IDS.DRIVER_FREE) return { role: 'DRIVER', tier: 'FREE' };
  if (priceId === PRICE_IDS.DRIVER_STANDARD) return { role: 'DRIVER', tier: 'STANDARD' };
  if (priceId === PRICE_IDS.DRIVER_PRO) return { role: 'DRIVER', tier: 'PRO' };
  if (priceId === PRICE_IDS.SHIPPER_STARTER) return { role: 'SHIPPER', tier: 'STARTER' };
  if (priceId === PRICE_IDS.SHIPPER_GROWTH) return { role: 'SHIPPER', tier: 'GROWTH' };
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return;

  const tierInfo = getTierFromPriceId(priceId);
  if (!tierInfo) return;

  if (tierInfo.role === 'DRIVER') {
    await prisma.driver.update({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionId,
        subscriptionTier: tierInfo.tier as 'FREE' | 'STANDARD' | 'PRO',
        subscriptionStatus: 'active',
      },
    });
  } else {
    await prisma.shipper.update({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionId,
        subscriptionTier: tierInfo.tier as 'CASUAL' | 'STARTER' | 'GROWTH',
        subscriptionStatus: 'active',
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const status = subscription.status;

  if (!priceId) return;

  const tierInfo = getTierFromPriceId(priceId);

  // Try to update driver first, then shipper
  const driver = await prisma.driver.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (driver) {
    const data: Record<string, unknown> = { subscriptionStatus: status };
    if (tierInfo?.role === 'DRIVER') {
      data.subscriptionTier = tierInfo.tier;
    }
    await prisma.driver.update({
      where: { stripeCustomerId: customerId },
      data,
    });

    // If subscription is no longer active, set driver offline
    if (status !== 'active') {
      await prisma.driver.update({
        where: { stripeCustomerId: customerId },
        data: { isAvailable: false },
      });
    }
    return;
  }

  const shipper = await prisma.shipper.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (shipper) {
    const data: Record<string, unknown> = { subscriptionStatus: status };
    if (tierInfo?.role === 'SHIPPER') {
      data.subscriptionTier = tierInfo.tier;
    }
    await prisma.shipper.update({
      where: { stripeCustomerId: customerId },
      data,
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const driver = await prisma.driver.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (driver) {
    await prisma.driver.update({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionId: null,
        subscriptionStatus: 'canceled',
        isAvailable: false,
      },
    });
    return;
  }

  const shipper = await prisma.shipper.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (shipper) {
    await prisma.shipper.update({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionId: null,
        subscriptionStatus: 'canceled',
      },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const driver = await prisma.driver.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (driver) {
    await prisma.driver.update({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionStatus: 'past_due',
        isAvailable: false,
      },
    });
    return;
  }

  const shipper = await prisma.shipper.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (shipper) {
    await prisma.shipper.update({
      where: { stripeCustomerId: customerId },
      data: { subscriptionStatus: 'past_due' },
    });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return;

  const isOnboarded =
    account.charges_enabled && account.payouts_enabled && account.details_submitted;

  if (isOnboarded) {
    const driver = await prisma.driver.findUnique({
      where: { stripeConnectAccountId: account.id },
    });

    if (driver && !driver.stripeConnectOnboarded) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { stripeConnectOnboarded: true },
      });
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        // Unhandled event type -- acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
