import { Request, Response, NextFunction } from 'express';
import { VisitService } from '../services/visit.service';
import { ChecklistService } from '../services/checklist.service';
import { UnauthorizedError } from '../utils/errors';

export class VisitController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const visit = await VisitService.createVisitSchedule(req.body);

      res.status(201).json({
        success: true,
        data: visit
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBySite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const visits = await VisitService.getVisitsForSite(req.params.siteId as string);

      res.status(200).json({
        success: true,
        data: visits
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyAssignedVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const visits = await VisitService.getVisitsForTechnician(req.user.userId);

      res.status(200).json({
        success: true,
        data: visits
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const history = await VisitService.getVisitHistory(req.user);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const visit = await VisitService.getVisitById(req.params.id as string, req.user);

      res.status(200).json({
        success: true,
        data: visit
      });
    } catch (error) {
      next(error);
    }
  }

  public static async assignTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await VisitService.assignTechnician(req.params.id as string, req.body.technicianId);

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await VisitService.updateVisitStatus(req.params.id as string, req.body.status);

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getChecklistTemplates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = ChecklistService.getStandardTemplates();
      res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }

  public static async submitInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Check for Idempotency-Key header fallback
      const headerKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;
      if (headerKey && !req.body.idempotencyKey) {
        req.body.idempotencyKey = headerKey;
      }

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await VisitService.submitInspection(
        req.params.id as string,
        req.body,
        req.user,
        ipAddress,
        userAgent
      );

      if (result.isDuplicate) {
        res.setHeader('X-Cache-Lookup', 'HIT');
        res.status(200).json({
          success: true,
          message: 'Inspection submission already processed (idempotent response)',
          data: result.record
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Inspection submitted and sealed with cryptographic SHA-256 record',
        data: result.record
      });
    } catch (error) {
      next(error);
    }
  }
}
