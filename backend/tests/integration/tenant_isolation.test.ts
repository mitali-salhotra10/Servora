import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';
import { UserRole } from '@prisma/client';
import { signToken } from '../../src/utils/jwt';

describe('Multi-Tenant Isolation & Cross-Customer Security Boundary (SEC-003)', () => {
  const customerA = {
    userId: 'aaaaaaaa-1111-4111-a111-111111111111',
    email: 'clientA@servora.app',
    role: UserRole.CUSTOMER,
    tokenVersion: 1,
    customerProfileId: 'aaaaaaaa-2222-4222-a222-222222222222'
  };

  const customerB = {
    userId: 'bbbbbbbb-1111-4111-b111-111111111111',
    email: 'clientB@servora.app',
    role: UserRole.CUSTOMER,
    tokenVersion: 1,
    customerProfileId: 'bbbbbbbb-2222-4222-b222-222222222222'
  };

  const adminUser = {
    userId: 'cccccccc-1111-4111-c111-111111111111',
    email: 'admin@servora.app',
    role: UserRole.ADMIN,
    tokenVersion: 1
  };

  const tokenA = signToken(customerA);
  const tokenB = signToken(customerB);
  const adminToken = signToken(adminUser);

  const siteA = {
    id: '11111111-1111-4111-a111-111111111111',
    customerId: 'aaaaaaaa-2222-4222-a222-222222222222',
    siteName: 'Customer A Logistics Center',
    address: '100 North Way',
    city: 'Pune',
    postalCode: '411001',
    latitude: 18.5204,
    longitude: 73.8567,
    geofenceRadiusMeters: 100,
    onSiteContactName: 'Manager A',
    onSiteContactPhone: '+919000000001',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Site Multi-Tenancy Boundary', () => {
    it('Customer A can retrieve their own site', async () => {
      vi.spyOn(prisma.site, 'findUnique').mockResolvedValue(siteA as unknown as typeof prisma.site.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .get(`/api/v1/sites/${siteA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(siteA.id);
    });

    it('Customer B is strictly forbidden (403) from accessing Customer A\'s site', async () => {
      vi.spyOn(prisma.site, 'findUnique').mockResolvedValue(siteA as unknown as typeof prisma.site.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .get(`/api/v1/sites/${siteA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Customer B is strictly forbidden (403) from updating Customer A\'s site', async () => {
      vi.spyOn(prisma.site, 'findUnique').mockResolvedValue(siteA as unknown as typeof prisma.site.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .put(`/api/v1/sites/${siteA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ siteName: 'Hacked Site Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Platform Admin can inspect any customer\'s site (Administrative Access)', async () => {
      vi.spyOn(prisma.site, 'findUnique').mockResolvedValue(siteA as unknown as typeof prisma.site.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .get(`/api/v1/sites/${siteA.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Equipment Multi-Tenancy Boundary', () => {
    it('Customer B is strictly forbidden (403) from registering equipment on Customer A\'s site', async () => {
      vi.spyOn(prisma.site, 'findUnique').mockResolvedValue(siteA as unknown as typeof prisma.site.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .post('/api/v1/equipment')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          siteId: siteA.id,
          serialNumber: 'EQ-ATTACK-01',
          qrCodeIdentifier: 'QR-ATTACK-01',
          equipmentType: 'FIRE_EXTINGUISHER',
          specification: '9L Water Extinguisher',
          locationInSite: 'Basement Parking'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Customer B is strictly forbidden (403) from viewing equipment on Customer A\'s site', async () => {
      vi.spyOn(prisma.site, 'findUnique').mockResolvedValue(siteA as unknown as typeof prisma.site.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .get(`/api/v1/equipment/site/${siteA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
