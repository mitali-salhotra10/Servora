import { z } from 'zod';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuidField = (msg = 'Invalid UUID') => z.string().regex(uuidRegex, msg);

export const createVisitScheduleSchema = z.object({
  siteId: uuidField('Invalid siteId UUID'),
  contractId: uuidField('Invalid contractId UUID').optional(),
  serviceRequestId: uuidField('Invalid serviceRequestId UUID').optional(),
  assignedTechnicianId: uuidField('Invalid assignedTechnicianId UUID').optional(),
  targetDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  visitType: z.enum(['RECURRING_MAINTENANCE', 'EMERGENCY_INSPECTION', 'REPAIR_REFILL']).default('RECURRING_MAINTENANCE')
});

export const assignTechnicianSchema = z.object({
  technicianId: uuidField('Invalid technicianId UUID')
});

export const updateVisitStatusSchema = z.object({
  status: z.enum(['PLANNED', 'ASSIGNED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'])
});

export const checklistResponseItemSchema = z.object({
  equipmentId: uuidField('Invalid equipmentId UUID'),
  templateId: uuidField('Invalid templateId UUID').optional(),
  domainCategory: z.enum(['FIRE_EXTINGUISHER', 'FIRE_HYDRANT', 'FIRE_ALARM', 'GENERAL_SAFETY']).optional(),
  responsesJson: z.record(z.string(), z.any()),
  passedInspection: z.boolean(),
  defectNotes: z.string().nullable().optional()
});

export const attachmentItemSchema = z.object({
  equipmentId: uuidField().optional(),
  fileType: z.enum(['PHOTO_BEFORE', 'PHOTO_AFTER', 'PRESSURE_GAUGE', 'SIGNATURE_IMAGE', 'DEFECT_PROOF']),
  fileUri: z.string().min(1, 'fileUri cannot be empty'),
  fileHash: z.string().optional(),
  mimeType: z.string().min(1, 'mimeType required'),
  fileSizeBytes: z.number().int().positive()
});

export const submitInspectionSchema = z.object({
  idempotencyKey: z.string().min(8, 'idempotencyKey must be at least 8 characters long'),
  checkInLatitude: z.coerce.number().min(-90).max(90),
  checkInLongitude: z.coerce.number().min(-180).max(180),
  checkInAccuracyMeters: z.coerce.number().positive().optional(),
  isGeofenceVerified: z.boolean().optional(),
  geofenceOverrideReason: z.string().optional(),
  checkOutTimestamp: z.string().datetime().optional(),
  customerSignerName: z.string().optional(),
  customerSignatureData: z.string().optional(),
  technicianNotes: z.string().optional(),
  checklistResponses: z.array(checklistResponseItemSchema).min(1, 'At least one equipment checklist response is required'),
  attachments: z.array(attachmentItemSchema).optional()
});

export type CreateVisitScheduleInput = z.infer<typeof createVisitScheduleSchema>;
export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>;
export type ChecklistResponseItemInput = z.infer<typeof checklistResponseItemSchema>;
export type AttachmentItemInput = z.infer<typeof attachmentItemSchema>;
export type SubmitInspectionInput = z.infer<typeof submitInspectionSchema>;
