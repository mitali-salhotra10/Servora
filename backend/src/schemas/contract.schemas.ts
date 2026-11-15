import { z } from 'zod';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuidField = (msg = 'Invalid UUID') => z.string().regex(uuidRegex, msg);

export const createContractSchema = z.object({
  contractNumber: z.string().min(3, 'Contract number is required').max(50),
  customerId: uuidField('Invalid customerId UUID'),
  providerId: uuidField('Invalid providerId UUID'),
  siteId: uuidField('Invalid siteId UUID'),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL']).default('ANNUAL'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  gracePeriodDays: z.coerce.number().int().min(0).max(90).default(7),
  termsSummary: z.string().max(2000).optional(),
  equipmentIds: z.array(uuidField()).optional()
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'endDate must be after startDate', path: ['endDate'] }
);

export const updateContractStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'TERMINATED'])
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractStatusInput = z.infer<typeof updateContractStatusSchema>;
