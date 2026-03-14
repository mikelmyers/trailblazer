import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
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
  return stripe.checkout.sessions.create(
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
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
