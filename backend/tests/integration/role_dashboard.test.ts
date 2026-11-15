import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { UserRole } from '@prisma/client';
import { prisma } from '../../src/db/prisma';
import { signToken } from '../../src/utils/jwt';

describe('Role-Based Dashboards & Service Request Operations', () => {
  const customerUser = {
    userId: '00000000-0000-0000-0001-000000000002',
    email: 'facilities@apexcommerce.com',
    role: UserRole.CUSTOMER,
    tokenVersion: 1,
    customerProfileId: '00000000-0000-0000-0002-000000000001'
  };

  const technicianUser = {
    userId: 'tech-uuid-1',
    email: 'tech@servora.app',
    role: UserRole.SERVICE_PROVIDER,
    tokenVersion: 1,
    providerProfileId: 'prov-profile-uuid-1'
  };

  const managerUser = {
    userId: 'mgr-uuid-1',
    email: 'manager@servora.app',
    role: UserRole.SERVICE_MANAGER,
    tokenVersion: 1,
    providerProfileId: 'prov-profile-uuid-1'
  };

  const adminUser = {
    userId: 'admin-uuid-1',
    email: 'admin@servora.app',
    role: UserRole.ADMIN,
    tokenVersion: 1
  };

  const customerToken = signToken(customerUser);
  const techToken = signToken(technicianUser);
  const managerToken = signToken(managerUser);
  const adminToken = signToken(adminUser);

  describe('GET /api/v1/dashboard/metrics', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/dashboard/metrics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }, 25000);

    it('should return customer dashboard metrics with facility summary and compliance status', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.CUSTOMER);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalFacilities).toBeDefined();
      expect(res.body.data.metrics.totalEquipment).toBeDefined();
      expect(res.body.data.metrics.complianceStatus).toBeDefined();
      expect(res.body.data.metrics.upcomingInspections).toBeDefined();
    }, 25000);

    it('should return technician dashboard metrics with today visits and inspection counts', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.SERVICE_PROVIDER);
      expect(res.body.data.metrics.todayVisits).toBeDefined();
      expect(res.body.data.metrics.pendingInspections).toBeDefined();
      expect(res.body.data.metrics.completedInspections).toBeDefined();
    }, 25000);

    it('should return manager dashboard metrics with active contracts and SLA performance', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.SERVICE_MANAGER);
      expect(res.body.data.metrics.activeContracts).toBeDefined();
      expect(res.body.data.metrics.activeTechnicians).toBeDefined();
      expect(res.body.data.metrics.slaPerformance).toBeDefined();
    }, 25000);

    it('should return admin dashboard metrics with platform stats and system health', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.ADMIN);
      expect(res.body.data.metrics.totalOrganizations).toBeDefined();
      expect(res.body.data.metrics.totalFacilities).toBeDefined();
      expect(res.body.data.metrics.systemHealth).toBeDefined();
    }, 25000);
  });

  describe('Service Request Life-Cycle (/api/v1/service-requests)', () => {
    let createdRequestId: string;

    it('should allow customer to create a service request with category and urgency', async () => {
      let targetSiteId = '00000000-0000-0000-0003-000000000001';
      try {
        const site = await prisma.site.findFirst();
        if (site) targetSiteId = site.id;
      } catch (e) {
        // Fallback to seeded site ID
      }

      const res = await request(app)
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          siteId: targetSiteId,
          category: 'Pressure Gauge Low',
          urgency: 'HIGH',
          preferredDate: '2026-12-01',
          preferredTimeSlot: 'MORNING_09_12',
          customerNotes: 'Pressure gauge on floor 3 water mist extinguisher shows below nominal reading.'
        });

      expect([201, 200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.ticketNumber).toBeDefined();
      createdRequestId = res.body.data.id;
    }, 35000);

    it('should allow all authenticated roles to list service requests', async () => {
      const res = await request(app)
        .get('/api/v1/service-requests')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    }, 35000);

    it('should allow manager to update service request status', async () => {
      if (!createdRequestId) return;

      const res = await request(app)
        .patch(`/api/v1/service-requests/${createdRequestId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'SCHEDULED'
        }, 25000);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SCHEDULED');
    }, 25000);

    it('should reject non-cancellation status change by customer', async () => {
      if (!createdRequestId) return;

      const res = await request(app)
        .patch(`/api/v1/service-requests/${createdRequestId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'COMPLETED'
        }, 25000);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }, 25000);
  });
});
