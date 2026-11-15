import { Request, Response, NextFunction } from 'express';
import { EquipmentService } from '../services/equipment.service';
import { UnauthorizedError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../db/prisma';

export class EquipmentController {
  private static async resolveCustomerId(req: Request): Promise<string> {
    if (req.user?.customerProfileId) {
      return req.user.customerProfileId;
    }
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user.userId }
    });
    if (!profile) {
      throw new UnauthorizedError('User does not have an associated customer profile');
    }
    return profile.id;
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === UserRole.ADMIN;
      const customerId = await EquipmentController.resolveCustomerId(req);
      const equipment = await EquipmentService.registerEquipment(customerId, req.body, isAdmin);

      res.status(201).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBySite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === UserRole.ADMIN;
      let customerId: string | undefined;

      if (!isAdmin && req.user?.role === UserRole.CUSTOMER) {
        customerId = await EquipmentController.resolveCustomerId(req);
      }

      const equipment = await EquipmentService.getEquipmentForSite(req.params.siteId as string, customerId, isAdmin);

      res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getByQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const equipment = await EquipmentService.getEquipmentByQrCode(req.params.qrCode as string);

      res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await EquipmentService.updateEquipment(req.params.id as string, req.body);

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
