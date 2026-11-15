import { Router } from 'express';
import authRoutes from './auth.routes';
import siteRoutes from './site.routes';
import equipmentRoutes from './equipment.routes';
import contractRoutes from './contract.routes';
import visitRoutes from './visit.routes';
import attachmentRoutes from './attachment.routes';
import certificateRoutes from './certificate.routes';
import dashboardRoutes from './dashboard.routes';
import serviceRequestRoutes from './serviceRequest.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';

const apiRouter = Router();

// Mount domain routes under /api/v1
apiRouter.use('/auth', authRoutes);
apiRouter.use('/sites', siteRoutes);
apiRouter.use('/equipment', equipmentRoutes);
apiRouter.use('/contracts', contractRoutes);
apiRouter.use('/visits', visitRoutes);
apiRouter.use('/attachments', attachmentRoutes);
apiRouter.use('/certificates', certificateRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/service-requests', serviceRequestRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/team', adminRoutes);

export { apiRouter, healthRoutes };
