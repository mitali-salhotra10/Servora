import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter, healthRoutes } from './routes';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';
import { generalApiRateLimiter } from './middleware/rateLimit.middleware';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers (SEC-009)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' }
    })
  );

  // 2. Explicit Configurable CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key']
    })
  );

  // 3. JSON body parsing with strict 5MB limit
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 4. Health and readiness probes
  app.use(healthRoutes);
  app.use('/api/v1', healthRoutes);

  // 5. Versioned API routes with general rate limiter
  app.use('/api/v1', generalApiRateLimiter, apiRouter);

  // 6. 404 handler for unknown routes
  app.use(notFoundHandler);

  // 7. Centralized error handling middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
