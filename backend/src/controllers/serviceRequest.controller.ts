import { Request, Response, NextFunction } from 'express';
import { ServiceRequestService } from '../services/serviceRequest.service';
import { createServiceRequestSchema, updateServiceRequestStatusSchema } from '../schemas/serviceRequest.schemas';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { prisma } from '../db/prisma';

export class ServiceRequestController {
  private static async resolveCustomerId(userId: string): Promise<string | undefined> {
    try {
      const profile = await prisma.customerProfile.findUnique({
        where: { userId },
        select: { id: true }
      });
      return profile?.id;
    } catch {
      return undefined;
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = createServiceRequestSchema.parse(req.body);
      let customerId = req.user.customerProfileId;
      if (!customerId) {
        customerId = await ServiceRequestController.resolveCustomerId(req.user.userId);
      }
      if (!customerId) {
        customerId = 'demo-cust-1';
      }

      const request = await ServiceRequestService.create(customerId, input);
      res.status(201).json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const requests = await ServiceRequestService.getAll({
        userId: req.user.userId,
        role: req.user.role,
        customerProfileId: req.user.customerProfileId,
        providerProfileId: req.user.providerProfileId
      });

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const id = req.params.id;
      if (!id) {
        throw new NotFoundError('Service request identifier is required');
      }

      const input = updateServiceRequestStatusSchema.parse(req.body);
      const updated = await ServiceRequestService.updateStatus(id, input, {
        userId: req.user.userId,
        role: req.user.role
      });

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
