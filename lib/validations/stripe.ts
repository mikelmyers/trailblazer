import { z } from 'zod';

export const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
