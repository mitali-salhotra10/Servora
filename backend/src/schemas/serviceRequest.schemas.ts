import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  siteId: z.string().min(1, 'Site identifier is required'),
  category: z.string().min(2, 'Service category is required'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('MEDIUM'),
  preferredDate: z.string().min(1, 'Preferred service date is required'),
  preferredTimeSlot: z.string().optional().default('MORNING_09_12'),
  customerNotes: z.string().min(3, 'Detailed description of the issue or complaint is required')
});

export const updateServiceRequestStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'RESOLVED', 'REJECTED', 'CANCELLED']),
  rejectionReason: z.string().optional(),
  assignedTechnicianId: z.string().optional()
});

export const CreateServiceRequestSchema = createServiceRequestSchema;
export const UpdateServiceRequestStatusSchema = updateServiceRequestStatusSchema;

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type UpdateServiceRequestStatusInput = z.infer<typeof updateServiceRequestStatusSchema>;
