import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, TokenPayload } from '../../src/utils/jwt';
import { UserRole } from '@prisma/client';
import { UnauthorizedError } from '../../src/utils/errors';

describe('JWT Utility (SEC-002)', () => {
  const samplePayload: TokenPayload = {
    userId: '11111111-2222-3333-4444-555555555555',
    email: 'tech@servora.app',
    role: UserRole.SERVICE_PROVIDER,
    tokenVersion: 1
  };

  it('should sign and verify a valid JWT token', () => {
    const token = signToken(samplePayload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(samplePayload.userId);
    expect(decoded.email).toBe(samplePayload.email);
    expect(decoded.role).toBe(samplePayload.role);
    expect(decoded.tokenVersion).toBe(samplePayload.tokenVersion);
  });

  it('should reject an expired token', async () => {
    // Sign token with 1ms expiration
    const expiredToken = signToken(samplePayload, '1ms');

    // Wait 50ms to ensure expiration
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(() => verifyToken(expiredToken)).toThrow(UnauthorizedError);
    expect(() => verifyToken(expiredToken)).toThrow(/expired/);
  });

  it('should reject a tampered token signature', () => {
    const token = signToken(samplePayload);
    const parts = token.split('.');
    // Corrupt the signature segment
    const tampered = `${parts[0]}.${parts[1]}.badSignature12345`;

    expect(() => verifyToken(tampered)).toThrow(UnauthorizedError);
  });

  it('should reject completely malformed token strings', () => {
    expect(() => verifyToken('not-even-a-jwt')).toThrow(UnauthorizedError);
  });
});
