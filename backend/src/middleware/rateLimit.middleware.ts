import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipInTest?: boolean;
}

/**
 * High-performance in-memory sliding-window rate limiter middleware.
 * Enforces request throttling without requiring external Redis infrastructure.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const ipStore = new Map<string, RateLimitRecord>();
  const { windowMs, maxRequests, message = 'Too many requests. Please try again later.', skipInTest = true } = options;

  // Periodic cleanup every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, Math.max(windowMs, 60000));

  // Allow the process to exit cleanly without keeping interval alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip in automated test environment if requested
    if (skipInTest && process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipStore.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      ipStore.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: retryAfterSec
        }
      });
      return;
    }

    next();
  };
}

// 1. Strict rate limiter for Authentication endpoints (15 attempts per 15 minutes in production, 100 in dev/test)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: process.env.NODE_ENV === 'production' ? 15 : 100,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
});

// 2. Rate limiter for Public Verification portal (60 requests per minute)
export const publicVerifyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Public verification query limit reached. Please wait a minute.'
});

// 3. General API rate limiter (300 requests per minute)
export const generalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  message: 'API request limit exceeded. Please throttle your requests.'
});
