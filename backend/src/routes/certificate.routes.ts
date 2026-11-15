import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';
import { publicVerifyRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public Unauthenticated Verification Endpoint (SEC-006)
router.get(
  '/verify/:certificateNumber',
  publicVerifyRateLimiter,
  CertificateController.verifyPublic
);

// PDF Download / Preview
router.get(
  '/:id/pdf',
  CertificateController.downloadPdf
);

// Authenticated Certificates List for Current Tenant / Provider / Admin
router.get(
  '/',
  authenticate,
  CertificateController.list
);

// Authenticated Certificate Generation Trigger
router.post(
  '/generate',
  authenticate,
  requireRole(UserRole.SERVICE_PROVIDER, UserRole.SERVICE_MANAGER, UserRole.ADMIN),
  CertificateController.generate
);

export default router;
