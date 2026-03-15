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
