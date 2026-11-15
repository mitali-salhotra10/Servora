import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../src/utils/password';

describe('Password Utility (bcryptjs & SEC-001)', () => {
  it('should hash password with salt rounds >= 10', async () => {
    const raw = 'SecurePass123!';
    const hashed = await hashPassword(raw);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(raw);
    // Standard bcrypt prefix with 10 rounds: $2a$10$ or $2b$10$
    expect(hashed).toMatch(/^\$2[ab]\$10\$/);
  });

  it('should verify correct password', async () => {
    const raw = 'CorrectPassword#2026';
    const hashed = await hashPassword(raw);

    const isMatch = await comparePassword(raw, hashed);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const raw = 'CorrectPassword#2026';
    const hashed = await hashPassword(raw);

    const isMatch = await comparePassword('WrongPassword#2026', hashed);
    expect(isMatch).toBe(false);
  });

  it('should enforce password complexity rules', () => {
    expect(validatePasswordStrength('Short1!').isValid).toBe(false);
    expect(validatePasswordStrength('NoNumeralSpecial!').isValid).toBe(false);
    expect(validatePasswordStrength('NoSpecialChar1234').isValid).toBe(false);
    expect(validatePasswordStrength('ValidPassword123!').isValid).toBe(true);
  });
});
