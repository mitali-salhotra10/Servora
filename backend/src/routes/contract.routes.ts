import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createContractSchema, updateContractStatusSchema } from '../schemas/contract.schemas';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole(UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(createContractSchema),
  ContractController.create
);

router.get(
  '/',
  requireRole(UserRole.CUSTOMER, UserRole.SERVICE_PROVIDER, UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  ContractController.getMyContracts
);

router.get(
  '/:id',
  ContractController.getById
);

router.patch(
  '/:id/status',
  requireRole(UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(updateContractStatusSchema),
  ContractController.updateStatus
);

export default router;
