import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../../src/middleware/rbac.middleware';
import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../src/utils/errors';

describe('RBAC Middleware (SEC-003 & FR-003)', () => {
  it('should allow user possessing an allowed role', () => {
    const middleware = requireRole(UserRole.CUSTOMER);
    const req = {
      user: {
        userId: 'user-1',
        email: 'customer@servora.app',
        role: UserRole.CUSTOMER,
        tokenVersion: 1
      }
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should grant universal access to ADMIN role', () => {
    const middleware = requireRole(UserRole.SERVICE_PROVIDER);
    const req = {
      user: {
        userId: 'admin-1',
        email: 'admin@servora.app',
        role: UserRole.ADMIN,
        tokenVersion: 1
      }
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject user with unauthorized role with 403 Forbidden', () => {
    const middleware = requireRole(UserRole.SERVICE_MANAGER, UserRole.ADMIN);
    const req = {
      user: {
        userId: 'customer-1',
        email: 'customer@servora.app',
        role: UserRole.CUSTOMER,
        tokenVersion: 1
      }
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.statusCode).toBe(403);
  });

  it('should reject unauthenticated request with 401 Unauthorized', () => {
    const middleware = requireRole(UserRole.CUSTOMER);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.statusCode).toBe(401);
  });
});
