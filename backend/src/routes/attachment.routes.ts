import { Router } from 'express';
import multer from 'multer';
import { AttachmentController } from '../controllers/attachment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

// Authenticated multipart binary upload
router.post(
  '/',
  authenticate,
  requireRole(UserRole.SERVICE_PROVIDER, UserRole.ADMIN),
  upload.single('file'),
  AttachmentController.upload
);

// Metadata lookup
router.get(
  '/:id',
  authenticate,
  AttachmentController.getById
);

// Binary file streaming
router.get(
  '/:id/file',
  authenticate,
  AttachmentController.getFile
);

export default router;
