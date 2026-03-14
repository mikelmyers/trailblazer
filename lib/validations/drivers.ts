import { z } from 'zod';

export const updateLocationSchema = z.object({
  currentLat: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  currentLng: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
});

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const driverQuerySchema = z.object({
  availability: z.enum(['true', 'false']).optional(),
  vehicleType: z.enum(['BIKE', 'CAR', 'VAN', 'TRUCK', 'CARGO_VAN']).optional(),
  serviceArea: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type DriverQueryInput = z.infer<typeof driverQuerySchema>;
