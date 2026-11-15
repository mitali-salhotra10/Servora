import { z } from 'zod';

export const createSiteSchema = z.object({
  siteName: z.string().min(2, 'Site name must be at least 2 characters').max(255),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required').max(100),
  postalCode: z.string().min(2, 'Postal code is required').max(20),
  latitude: z.coerce.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  geofenceRadiusMeters: z.coerce.number().int().min(10).max(5000).default(100),
  onSiteContactName: z.string().min(2, 'On-site contact name is required').max(255),
  onSiteContactPhone: z.string().min(5, 'On-site contact phone is required').max(50)
});

export const updateSiteSchema = createSiteSchema.partial();

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
