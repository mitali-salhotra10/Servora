import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { UnauthorizedError } from '../utils/errors';

export class DashboardController {
  public static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const metrics = await DashboardService.getMetrics({
        userId: req.user.userId,
        role: req.user.role,
        customerProfileId: req.user.customerProfileId,
        providerProfileId: req.user.providerProfileId
      });

      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}
