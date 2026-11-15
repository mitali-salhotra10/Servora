import { prisma } from '../db/prisma';
import { CreateSiteInput, UpdateSiteInput } from '../schemas/site.schemas';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export class SiteService {
  public static async createSite(customerId: string, input: CreateSiteInput) {
    return prisma.site.create({
      data: {
        customerId,
        siteName: input.siteName,
        address: input.address,
        city: input.city,
        postalCode: input.postalCode,
        latitude: new Prisma.Decimal(input.latitude),
        longitude: new Prisma.Decimal(input.longitude),
        geofenceRadiusMeters: input.geofenceRadiusMeters,
        onSiteContactName: input.onSiteContactName,
        onSiteContactPhone: input.onSiteContactPhone
      }
    });
  }

  public static async getSitesForCustomer(customerId: string) {
    return prisma.site.findMany({
      where: { customerId },
      include: {
        _count: {
          select: { equipment: true, visitSchedules: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async getAllSites() {
    return prisma.site.findMany({
      include: {
        _count: {
          select: { equipment: true, visitSchedules: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async getSiteById(siteId: string, requestingCustomerId?: string, isAdmin: boolean = false) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        equipment: true,
        _count: {
          select: { visitSchedules: true, contracts: true }
        }
      }
    });

    if (!site) {
      throw new NotFoundError(`Site with ID "${siteId}" not found`);
    }

    if (!isAdmin && requestingCustomerId && site.customerId !== requestingCustomerId) {
      throw new ForbiddenError('Access denied: You do not have permission to view this site');
    }

    return site;
  }

  public static async updateSite(siteId: string, requestingCustomerId: string, input: UpdateSiteInput, isAdmin: boolean = false) {
    const existing = await this.getSiteById(siteId, requestingCustomerId, isAdmin);

    return prisma.site.update({
      where: { id: existing.id },
      data: {
        siteName: input.siteName,
        address: input.address,
        city: input.city,
        postalCode: input.postalCode,
        latitude: input.latitude !== undefined ? new Prisma.Decimal(input.latitude) : undefined,
        longitude: input.longitude !== undefined ? new Prisma.Decimal(input.longitude) : undefined,
        geofenceRadiusMeters: input.geofenceRadiusMeters,
        onSiteContactName: input.onSiteContactName,
        onSiteContactPhone: input.onSiteContactPhone
      }
    });
  }
}
