import { z } from 'zod';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuidField = (msg = 'Invalid UUID') => z.string().regex(uuidRegex, msg);

export const createEquipmentSchema = z.object({
  siteId: uuidField('Invalid siteId UUID format'),
  serialNumber: z.string().min(2, 'Serial number is required').max(100),
  qrCodeIdentifier: z.string().min(3, 'QR code identifier must be at least 3 characters').max(100),
  equipmentType: z.enum(['FIRE_EXTINGUISHER', 'FIRE_HYDRANT', 'FIRE_ALARM_PANEL', 'DETECTOR_SENSOR'] as const, {
    message: 'Invalid equipment type'
  }),
  specification: z.string().min(2, 'Specification is required').max(255),
  locationInSite: z.string().min(2, 'Location inside site is required').max(255),
  manufacturingDate: z.string().datetime().optional()
});

export const updateEquipmentSchema = z.object({
  status: z.enum(['OPERATIONAL', 'NEEDS_MAINTENANCE', 'DECOMMISSIONED']).optional(),
  specification: z.string().min(2).max(255).optional(),
  locationInSite: z.string().min(2).max(255).optional(),
  lastInspectionDate: z.string().datetime().optional(),
  nextInspectionDueDate: z.string().datetime().optional()
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
