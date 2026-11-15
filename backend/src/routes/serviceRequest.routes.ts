import { Router } from 'express';
import { ServiceRequestController } from '../controllers/serviceRequest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// All authenticated roles can list service requests (filtered by tenant/role)
router.get('/', ServiceRequestController.getAll);

// Customers, Managers, and Admins can create service requests
router.post(
  '/',
  requireRole(UserRole.CUSTOMER, UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  ServiceRequestController.create
);

// Update status (Customer can cancel, Managers/Admins can accept/reject/schedule/complete)
router.patch(
  '/:id/status',
  requireRole(UserRole.CUSTOMER, UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  ServiceRequestController.updateStatus
);

export default router;
