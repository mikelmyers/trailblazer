import { z } from 'zod';

export const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
});

export const connectOnboardSchema = z.object({
  refreshUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ConnectOnboardInput = z.infer<typeof connectOnboardSchema>;
