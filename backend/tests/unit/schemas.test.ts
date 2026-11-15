import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../src/schemas/auth.schemas';
import { createSiteSchema } from '../../src/schemas/site.schemas';
import { createEquipmentSchema } from '../../src/schemas/equipment.schemas';
import { createContractSchema } from '../../src/schemas/contract.schemas';

describe('Zod Request Validation Schemas', () => {
  describe('Register Schema', () => {
    it('should validate customer registration payload', () => {
      const payload = {
        email: 'client@example.com',
        password: 'ValidPass123!',
        role: 'CUSTOMER',
        contactPersonName: 'Jane Doe',
        companyName: 'Acme Logistics'
      };

      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate provider registration payload', () => {
      const payload = {
        email: 'provider@example.com',
        password: 'ValidPass123!',
        role: 'SERVICE_PROVIDER',
        businessName: 'SafeGuard Fire Solutions',
        licenseNumber: 'FIRE-LIC-9901'
      };

      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should disallow self-registration as ADMIN or SERVICE_MANAGER (SEC-003)', () => {
      const payload = {
        email: 'hacker@example.com',
        password: 'ValidPass123!',
        role: 'ADMIN'
      };

      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail customer registration when contactPersonName is missing', () => {
      const payload = {
        email: 'client@example.com',
        password: 'ValidPass123!',
        role: 'CUSTOMER'
      };

      const result = registerSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Site Schema', () => {
    it('should validate correct site coordinates and geofence', () => {
      const payload = {
        siteName: 'Terminal Warehouse A',
        address: '123 Harbor Blvd',
        city: 'Mumbai',
        postalCode: '400001',
        latitude: 18.922,
        longitude: 72.834,
        geofenceRadiusMeters: 150,
        onSiteContactName: 'Rajesh Kumar',
        onSiteContactPhone: '+919876543210'
      };

      const result = createSiteSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid GPS latitude out of bounds (> 90)', () => {
      const payload = {
        siteName: 'Invalid Site',
        address: '123 Harbor Blvd',
        city: 'Mumbai',
        postalCode: '400001',
        latitude: 95.5,
        longitude: 72.834,
        onSiteContactName: 'Rajesh Kumar',
        onSiteContactPhone: '+919876543210'
      };

      const result = createSiteSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Contract Schema', () => {
    it('should reject contracts where endDate is before startDate', () => {
      const payload = {
        contractNumber: 'AMC-2026-INVALID',
        customerId: '11111111-1111-1111-1111-111111111111',
        providerId: '22222222-2222-2222-2222-222222222222',
        siteId: '33333333-3333-3333-3333-333333333333',
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-09-01T00:00:00.000Z' // Earlier than startDate
      };

      const result = createContractSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
