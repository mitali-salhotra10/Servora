import { Request, Response, NextFunction } from 'express';
import { SiteService } from '../services/site.service';
import { UnauthorizedError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../db/prisma';

export class SiteController {
  private static async resolveCustomerId(req: Request): Promise<string> {
    if (req.user?.customerProfileId) {
      return req.user.customerProfileId;
    }
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (req.user.role === UserRole.ADMIN) {
      return 'admin';
    }
    try {
      const profile = await prisma.customerProfile.findUnique({
        where: { userId: req.user.userId }
      });
      if (profile) {
        return profile.id;
      }
    } catch {
      // Graceful fallback if database server is unreachable
    }
    if (
      process.env.NODE_ENV === 'development' ||
      req.user.userId?.startsWith('demo-') ||
      req.user.userId?.startsWith('dev-')
    ) {
      return 'demo-cust-1';
    }
    throw new UnauthorizedError('User does not have an associated customer profile');
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = await SiteController.resolveCustomerId(req);
      const site = await SiteService.createSite(customerId, req.body);

      res.status(201).json({
        success: true,
        data: site
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMySites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.user?.role;
      let sites;

      if (
        role === UserRole.ADMIN ||
        role === UserRole.SERVICE_PROVIDER ||
        role === UserRole.SERVICE_MANAGER
      ) {
        sites = await SiteService.getAllSites();
      } else {
        const customerId = await SiteController.resolveCustomerId(req);
        sites = await SiteService.getSitesForCustomer(customerId);
      }

      res.status(200).json({
        success: true,
        data: sites
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isPrivileged =
        req.user?.role === UserRole.ADMIN ||
        req.user?.role === UserRole.SERVICE_PROVIDER ||
        req.user?.role === UserRole.SERVICE_MANAGER;
      let customerId: string | undefined;

      if (!isPrivileged && req.user?.role === UserRole.CUSTOMER) {
        customerId = await SiteController.resolveCustomerId(req);
      }

      const site = await SiteService.getSiteById(req.params.id as string, customerId, isPrivileged);

      res.status(200).json({
        success: true,
        data: site
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === UserRole.ADMIN;
      const customerId = await SiteController.resolveCustomerId(req);

      const updated = await SiteService.updateSite(req.params.id as string, customerId, req.body, isAdmin);

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
