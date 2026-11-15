import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError
} from '../../src/utils/errors';
import { errorHandler } from '../../src/middleware/error.middleware';
import { Request, Response, NextFunction } from 'express';

describe('Error Hierarchy & Error Handler Middleware', () => {
  it('should instantiate appropriate HTTP status codes for each AppError', () => {
    expect(new BadRequestError().statusCode).toBe(400);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new ValidationError().statusCode).toBe(422);
  });

  it('should format AppError into structured JSON response', () => {
    const error = new NotFoundError('Equipment EQ-01 not found');
    const req = {} as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(error, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOTFOUND',
        message: 'Equipment EQ-01 not found',
        details: undefined
      }
    });
  });

  it('should map syntax error (malformed JSON) to 400 Bad Request', () => {
    const error = new SyntaxError('Unexpected token in JSON');
    (error as unknown as { status: number }).status = 400;

    const req = {} as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(error, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload in request body'
      }
    });
  });
});
