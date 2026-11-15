import { Router } from 'express';
import { EquipmentController } from '../controllers/equipment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, requireSiteOwnership } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createEquipmentSchema, updateEquipmentSchema } from '../schemas/equipment.schemas';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole(UserRole.CUSTOMER, UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(createEquipmentSchema),
  EquipmentController.create
);

router.get(
  '/site/:siteId',
  requireSiteOwnership('siteId'),
  EquipmentController.getBySite
);

router.get(
  '/qr/:qrCode',
  EquipmentController.getByQr
);

router.put(
  '/:id',
  requireRole(UserRole.SERVICE_PROVIDER, UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(updateEquipmentSchema),
  EquipmentController.update
);

export default router;
