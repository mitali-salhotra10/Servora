import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../src/config/env';

describe('Environment Variable Validation (Zod)', () => {
  it('should validate valid configuration and apply defaults', () => {
    const validConfig = {
      PORT: '5000',
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/servora_test',
      JWT_SECRET: 'super-secret-jwt-key-minimum-16-characters-long',
      CORS_ORIGIN: 'http://localhost:5173'
    };

    const parsed = validateEnv(validConfig);
    expect(parsed.PORT).toBe(5000);
    expect(parsed.NODE_ENV).toBe('test');
    expect(parsed.JWT_EXPIRES_IN).toBe('1h');
    expect(parsed.UPLOAD_DIR).toBe('./uploads');
    expect(parsed.PUBLIC_VERIFICATION_BASE_URL).toBe('http://localhost:5173/verify');
  });

  it('should fail validation when DATABASE_URL is missing', () => {
    const invalidConfig = {
      PORT: '5000',
      NODE_ENV: 'test',
      JWT_SECRET: 'super-secret-jwt-key-minimum-16-characters-long'
    };

    expect(() => validateEnv(invalidConfig as Record<string, unknown>)).toThrow(/DATABASE_URL is required/);
  });

  it('should fail validation when JWT_SECRET is too short (< 16 chars)', () => {
    const invalidConfig = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/servora_test',
      JWT_SECRET: 'short'
    };

    expect(() => validateEnv(invalidConfig as Record<string, unknown>)).toThrow(/JWT_SECRET must be at least 16 characters/);
  });

  it('should fail validation when NODE_ENV is an invalid value', () => {
    const invalidConfig = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/servora_test',
      JWT_SECRET: 'super-secret-jwt-key-minimum-16-characters-long',
      NODE_ENV: 'invalid_env'
    };

    expect(() => validateEnv(invalidConfig as Record<string, unknown>)).toThrow(/Environment variable validation failed/);
  });
});
