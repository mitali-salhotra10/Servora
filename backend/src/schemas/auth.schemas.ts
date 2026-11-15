import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, 'Password must contain at least one numeral and one special character'),
  role: z.enum(['CUSTOMER', 'SERVICE_PROVIDER'] as const, {
    message: 'Self-registration is only allowed for CUSTOMER or SERVICE_PROVIDER'
  }),
  phone: z.string().optional(),
  // Customer-specific fields
  companyName: z.string().max(255).optional(),
  contactPersonName: z.string().min(2, 'Contact person name is required').max(255).optional(),
  billingAddress: z.string().optional(),
  // Provider-specific fields
  businessName: z.string().min(2, 'Business name is required').max(255).optional(),
  licenseNumber: z.string().min(2, 'License number is required').max(100).optional(),
  serviceRadiusKm: z.coerce.number().int().min(1).max(500).optional()
}).refine(
  (data) => {
    if (data.role === 'CUSTOMER' && !data.contactPersonName) {
      return false;
    }
    return true;
  },
  { message: 'contactPersonName is required when registering as CUSTOMER', path: ['contactPersonName'] }
).refine(
  (data) => {
    if (data.role === 'SERVICE_PROVIDER' && (!data.businessName || !data.licenseNumber)) {
      return false;
    }
    return true;
  },
  { message: 'businessName and licenseNumber are required when registering as SERVICE_PROVIDER', path: ['businessName'] }
);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
