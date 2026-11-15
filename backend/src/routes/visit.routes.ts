import { Router } from 'express';
import { VisitController } from '../controllers/visit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, requireSiteOwnership } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  createVisitScheduleSchema,
  assignTechnicianSchema,
  updateVisitStatusSchema,
  submitInspectionSchema
} from '../schemas/visit.schemas';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Checklist templates catalog
router.get('/checklists/templates', VisitController.getChecklistTemplates);

// Create visit schedule (Manager / Admin)
router.post(
  '/',
  requireRole(UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(createVisitScheduleSchema),
  VisitController.create
);

// Site-specific visits
router.get(
  '/site/:siteId',
  requireSiteOwnership('siteId'),
  VisitController.getBySite
);

// Technician's assigned manifest
router.get(
  '/my-assigned',
  requireRole(UserRole.SERVICE_PROVIDER, UserRole.SERVICE_MANAGER),
  VisitController.getMyAssignedVisits
);

// Inspection history and sealed execution records
router.get(
  '/history',
  VisitController.getHistory
);

// Specific visit details by ID
router.get(
  '/:id',
  VisitController.getById
);

// Assign technician to visit
router.put(
  '/:id/assign',
  requireRole(UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(assignTechnicianSchema),
  VisitController.assignTechnician
);

// Update visit status (Manager / Admin)
router.patch(
  '/:id/status',
  requireRole(UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(updateVisitStatusSchema),
  VisitController.updateStatus
);

// Submit inspection and sync execution record (Technician / Provider / Admin)
router.post(
  '/:id/inspections',
  requireRole(UserRole.SERVICE_PROVIDER, UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  validateBody(submitInspectionSchema),
  VisitController.submitInspection
);

export default router;
