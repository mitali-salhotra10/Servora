import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';
import { UserRole } from '@prisma/client';
import { signToken } from '../../src/utils/jwt';
import { hashPassword } from '../../src/utils/password';

describe('Authentication API Endpoints (MOD-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a customer successfully and return token (FR-001)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'cust-uuid-1',
        email: 'customer@servora.app',
        passwordHash: 'hashedPassword',
        role: UserRole.CUSTOMER,
        phone: '+919876543210',
        tokenVersion: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerProfile: {
          id: 'cust-prof-1',
          userId: 'cust-uuid-1',
          companyName: 'Acme Facilities',
          contactPersonName: 'Aarav Sharma',
          taxId: null,
          billingAddress: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        providerProfile: null
      } as unknown as typeof prisma.user.create extends (args: unknown) => Promise<infer R> ? R : never);

      vi.spyOn(prisma.auditEvent, 'create').mockResolvedValue({} as unknown as typeof prisma.auditEvent.create extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'customer@servora.app',
          password: 'Password123!',
          role: 'CUSTOMER',
          contactPersonName: 'Aarav Sharma',
          companyName: 'Acme Facilities',
          phone: '+919876543210'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('customer@servora.app');
      expect(res.body.data.user.customerProfile).toBeDefined();
      // Ensure passwordHash is never leaked in the response
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject registration when email already exists (FR-001)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'existing-id',
        email: 'duplicate@servora.app'
      } as unknown as typeof prisma.user.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@servora.app',
          password: 'Password123!',
          role: 'CUSTOMER',
          contactPersonName: 'Aarav Sharma'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject self-registration with ADMIN role (SEC-003)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin-attacker@servora.app',
          password: 'Password123!',
          role: 'ADMIN',
          contactPersonName: 'Attacker'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION');
    });

    it('should reject registration with weak password lacking numeral/special (SEC-001)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@servora.app',
          password: 'weakpassword',
          role: 'CUSTOMER',
          contactPersonName: 'Aarav Sharma'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user with valid credentials and return JWT (FR-002)', async () => {
      const hashed = await hashPassword('CorrectPass123!');

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@servora.app',
        passwordHash: hashed,
        role: UserRole.CUSTOMER,
        phone: null,
        tokenVersion: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerProfile: null,
        providerProfile: null
      } as unknown as typeof prisma.user.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      vi.spyOn(prisma.auditEvent, 'create').mockResolvedValue({} as unknown as typeof prisma.auditEvent.create extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@servora.app',
          password: 'CorrectPass123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('user@servora.app');
    });

    it('should reject login with wrong password and return 401 (FR-002)', async () => {
      const hashed = await hashPassword('CorrectPass123!');

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@servora.app',
        passwordHash: hashed,
        role: UserRole.CUSTOMER,
        tokenVersion: 1,
        isActive: true
      } as unknown as typeof prisma.user.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      vi.spyOn(prisma.auditEvent, 'create').mockResolvedValue({} as unknown as typeof prisma.auditEvent.create extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@servora.app',
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return profile for authenticated user (FR-006)', async () => {
      const token = signToken({
        userId: 'user-uuid-1',
        email: 'user@servora.app',
        role: UserRole.CUSTOMER,
        tokenVersion: 1
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@servora.app',
        role: UserRole.CUSTOMER,
        phone: null,
        tokenVersion: 1,
        isActive: true,
        customerProfile: { id: 'cp-1', companyName: 'Apex', contactPersonName: 'Aarav' },
        providerProfile: null
      } as unknown as typeof prisma.user.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('user-uuid-1');
    });

    it('should reject request when token is missing (FR-003)', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout (Token Revocation & SEC-002)', () => {
    it('should increment tokenVersion and revoke active sessions', async () => {
      const token = signToken({
        userId: 'user-uuid-1',
        email: 'user@servora.app',
        role: UserRole.CUSTOMER,
        tokenVersion: 1
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@servora.app',
        role: UserRole.CUSTOMER,
        tokenVersion: 1,
        isActive: true
      } as unknown as typeof prisma.user.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const updateSpy = vi.spyOn(prisma.user, 'update').mockResolvedValue({} as unknown as typeof prisma.user.update extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { tokenVersion: { increment: 1 } }
      });
    });
  });
});
