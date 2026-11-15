import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN, UserRole.SERVICE_MANAGER));

/**
 * GET /api/v1/admin/tenants
 * Returns all customer organizations and service providers from live PostgreSQL.
 */
router.get('/tenants', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customers = await prisma.customerProfile.findMany({
      include: {
        user: { select: { email: true, phone: true } },
        _count: { select: { sites: true, contracts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const providers = await prisma.providerProfile.findMany({
      include: {
        user: { select: { email: true, phone: true } },
        _count: { select: { contracts: true, services: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const tenantList = [
      ...customers.map(c => ({
        id: c.id,
        name: c.companyName || 'Corporate Facility Customer',
        type: 'CUSTOMER',
        contactPerson: c.contactPersonName,
        email: c.user?.email || '',
        phone: c.user?.phone || '',
        facilitiesCount: c._count.sites,
        contractsCount: c._count.contracts,
        status: 'ACTIVE'
      })),
      ...providers.map(p => ({
        id: p.id,
        name: p.businessName,
        type: 'SERVICE_PROVIDER',
        contactPerson: p.user?.email || 'Operations Lead',
        email: p.user?.email || '',
        phone: p.user?.phone || '',
        facilitiesCount: p._count.contracts,
        contractsCount: p._count.contracts,
        status: 'ACTIVE'
      }))
    ];

    res.status(200).json({
      success: true,
      data: tenantList
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/audit-logs
 * Returns live audit events and inspection completions.
 */
router.get('/audit-logs', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auditEvents = await prisma.auditEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        user: { select: { email: true, role: true } }
      }
    });

    const logs = auditEvents.map(e => ({
      id: e.id,
      action: e.action,
      actorEmail: e.user?.email || 'system@servora.com',
      targetResource: `${e.entityType}:${e.entityId}`,
      ipAddress: e.ipAddress || '127.0.0.1',
      timestamp: e.timestamp.toISOString(),
      recordHash: (e.payloadAfterJson as any)?.recordHash || 'N/A'
    }));

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/team
 * Returns all active service providers and technicians.
 */
router.get('/team', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.SERVICE_PROVIDER, UserRole.SERVICE_MANAGER] },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        providerProfile: { select: { businessName: true, licenseNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
});

export default router;
