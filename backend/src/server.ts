import { app } from './app';
import { env } from './config/env';
import { disconnectDatabase } from './db/prisma';

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`[Servora Server] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
  // eslint-disable-next-line no-console
  console.info(`[Servora Server] Health probe: http://localhost:${env.PORT}/health`);
  // eslint-disable-next-line no-console
  console.info(`[Servora Server] Readiness probe: http://localhost:${env.PORT}/ready`);
});

async function gracefulShutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.info(`[Servora Server] Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    // eslint-disable-next-line no-console
    console.info('[Servora Server] HTTP listener closed.');
    try {
      await disconnectDatabase();
      // eslint-disable-next-line no-console
      console.info('[Servora Server] Database connection closed.');
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Servora Server] Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('[Servora Server] Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[Servora Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  // eslint-disable-next-line no-console
  console.error('[Servora Server] Uncaught Exception:', error);
  process.exit(1);
});
