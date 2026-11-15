import { Router } from 'express';
import { SiteController } from '../controllers/site.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, requireSiteOwnership } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createSiteSchema, updateSiteSchema } from '../schemas/site.schemas';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
  validateBody(createSiteSchema),
  SiteController.create
);

router.get(
  '/',
  requireRole(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SERVICE_PROVIDER, UserRole.SERVICE_MANAGER),
  SiteController.getMySites
);

router.get(
  '/:id',
  requireSiteOwnership('id'),
  SiteController.getById
);

router.put(
  '/:id',
  requireSiteOwnership('id'),
  validateBody(updateSiteSchema),
  SiteController.update
);

export default router;
