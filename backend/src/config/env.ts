import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({ message: 'DATABASE_URL is required' }).min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters (>= 32 recommended)'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  PUBLIC_VERIFICATION_BASE_URL: z.string().default('http://localhost:5173/verify')
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(customEnv?: Record<string, unknown>): Env {
  const source = customEnv ?? process.env;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`[Config Error] Environment variable validation failed: ${errorDetails}`);
  }
  return parsed.data;
}

// In test environment, provide safe defaults if not present
if (process.env.NODE_ENV === 'test') {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/servora_test?schema=public';
  process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'servora-test-jwt-secret-key-at-least-32-chars-long';
}

export const env = validateEnv();
