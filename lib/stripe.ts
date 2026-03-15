import Stripe from 'stripe';

let _stripe: Stripe | null = null;
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead — kept for compatibility */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

export const PRICE_IDS = {
  DRIVER_FREE: process.env.STRIPE_DRIVER_FREE_PRICE_ID ?? '',
  DRIVER_STANDARD: process.env.STRIPE_DRIVER_STANDARD_PRICE_ID!,
  DRIVER_PRO: process.env.STRIPE_DRIVER_PRO_PRICE_ID!,
  SHIPPER_STARTER: process.env.STRIPE_SHIPPER_STARTER_PRICE_ID!,
  SHIPPER_GROWTH: process.env.STRIPE_SHIPPER_GROWTH_PRICE_ID!,
};

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return getStripe().checkout.sessions.create(
    {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    { idempotencyKey: `checkout_${customerId}_${Date.now()}` }
  );
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/* ── Stripe Connect (Driver Payouts) ─────────────────────────────────────── */

export async function createConnectAccount(email: string, name?: string) {
  return getStripe().accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: 'individual',
    individual: name ? { first_name: name.split(' ')[0], last_name: name.split(' ').slice(1).join(' ') || undefined } : undefined,
  });
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
) {
  return getStripe().accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

export async function getConnectAccountStatus(accountId: string) {
  const account = await getStripe().accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

/* ── Job Payment Intents ─────────────────────────────────────────────────── */

export async function createJobPaymentIntent(
  customerId: string,
  amountCents: number,
  jobReference: string,
) {
  return getStripe().paymentIntents.create({
    customer: customerId,
    amount: amountCents,
    currency: 'usd',
    capture_method: 'manual',
    metadata: { jobReference },
  });
}

export async function captureJobPayment(paymentIntentId: string) {
  return getStripe().paymentIntents.capture(paymentIntentId);
}

export async function cancelJobPayment(paymentIntentId: string) {
  return getStripe().paymentIntents.cancel(paymentIntentId);
}

export async function refundJobPayment(
  paymentIntentId: string,
  amountCents?: number,
) {
  return getStripe().refunds.create({
    payment_intent: paymentIntentId,
    ...(amountCents ? { amount: amountCents } : {}),
  });
}

export async function reverseTransfer(
  transferId: string,
  amountCents?: number,
) {
  return getStripe().transfers.createReversal(transferId, {
    ...(amountCents ? { amount: amountCents } : {}),
  });
}

export async function transferToDriver(
  amountCents: number,
  connectAccountId: string,
  jobId: string,
) {
  return getStripe().transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: connectAccountId,
    transfer_group: jobId,
    metadata: { jobId },
  });
}
