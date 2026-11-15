import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../db/prisma';
import { env } from '../config/env';

export class HealthController {
  public static getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        service: 'servora-backend',
        version: '0.1.0'
      }
    });
  }

  public static async getReadiness(_req: Request, res: Response): Promise<void> {
    const dbCheck = await checkDatabaseConnection();

    if (dbCheck.isConnected) {
      res.status(200).json({
        success: true,
        data: {
          status: 'ready',
          database: {
            connected: true,
            latencyMs: dbCheck.latencyMs
          },
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        data: {
          status: 'not_ready',
          database: {
            connected: false,
            message: 'Database is not reachable. Check DATABASE_URL and database service status.'
          },
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}
