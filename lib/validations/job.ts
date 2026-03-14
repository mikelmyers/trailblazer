import { z } from 'zod';

const packageSizeEnum = z.enum(['ENVELOPE', 'SMALL', 'MEDIUM', 'LARGE', 'PALLET'], {
  error: 'Invalid package size',
});

const urgencyEnum = z.enum(['STANDARD', 'EXPRESS', 'CRITICAL'], {
  error: 'Invalid urgency level',
});

const jobStatusEnum = z.enum(
  [
    'POSTED',
    'MATCHING',
    'MATCHED',
    'EN_ROUTE_PICKUP',
    'PICKED_UP',
    'EN_ROUTE_DROPOFF',
    'DELIVERED',
    'CANCELLED',
    'FAILED',
  ],
  {
    error: 'Invalid job status',
  }
);

export const createJobSchema = z.object({
  pickupAddress: z.string().min(5, 'Pickup address must be at least 5 characters'),
  pickupLat: z.number({ error: 'Pickup latitude is required' }),
  pickupLng: z.number({ error: 'Pickup longitude is required' }),
  dropoffAddress: z.string().min(5, 'Dropoff address must be at least 5 characters'),
  dropoffLat: z.number({ error: 'Dropoff latitude is required' }),
  dropoffLng: z.number({ error: 'Dropoff longitude is required' }),
  description: z.string().optional(),
  packageSize: packageSizeEnum,
  urgency: urgencyEnum,
});

export const updateJobStatusSchema = z.object({
  status: jobStatusEnum,
  driverId: z.string().optional(),
});

export const jobQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
export type JobQueryInput = z.infer<typeof jobQuerySchema>;
