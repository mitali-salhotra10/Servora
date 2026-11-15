import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';
import { UserRole, VisitStatus, EquipmentType, DomainCategory, EquipmentStatus } from '@prisma/client';
import { signToken } from '../../src/utils/jwt';

describe('Phase 4: Field Visits, Checklists & Offline Idempotent Sync API', () => {
  const techUser = {
    userId: '99999999-9999-4999-a999-999999999999',
    email: 'fieldtech@servora.app',
    role: UserRole.SERVICE_PROVIDER,
    tokenVersion: 1
  };

  const otherTechUser = {
    userId: '88888888-8888-4888-a888-888888888888',
    email: 'othertech@servora.app',
    role: UserRole.SERVICE_PROVIDER,
    tokenVersion: 1
  };

  const adminUser = {
    userId: '00000000-0000-4000-a000-000000000000',
    email: 'admin@servora.app',
    role: UserRole.ADMIN,
    tokenVersion: 1
  };

  const techToken = signToken(techUser);
  const otherTechToken = signToken(otherTechUser);
  const adminToken = signToken(adminUser);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Standard Checklist Templates Catalog', () => {
    it('GET /api/v1/visits/checklists/templates returns standardized templates', async () => {
      const res = await request(app)
        .get('/api/v1/visits/checklists/templates')
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const extinguisherTemplate = res.body.data.find(
        (t: any) => t.domainCategory === DomainCategory.FIRE_EXTINGUISHER
      );
      expect(extinguisherTemplate).toBeDefined();
      expect(extinguisherTemplate.items.length).toBeGreaterThan(0);
      expect(extinguisherTemplate.items.some((i: any) => i.id === 'FE-02')).toBe(true);
    });
  });

  describe('Visit Detail Retrieval (GET /api/v1/visits/:id)', () => {
    const mockVisit = {
      id: 'visit-uuid-1',
      siteId: 'site-uuid-1',
      assignedTechnicianId: techUser.userId,
      targetDate: new Date('2026-06-01T09:00:00Z'),
      dueDate: new Date('2026-06-01T17:00:00Z'),
      status: VisitStatus.ASSIGNED,
      site: {
        id: 'site-uuid-1',
        siteName: 'Metro Life Safety Tower',
        customerId: 'customer-uuid-1',
        latitude: 29.7604,
        longitude: -95.3698,
        geofenceRadiusMeters: 100,
        equipment: [
          {
            id: 'eq-uuid-1',
            serialNumber: 'FE-998811',
            qrCodeIdentifier: 'QR-FE-998811',
            equipmentType: EquipmentType.FIRE_EXTINGUISHER
          }
        ]
      },
      assignedTechnician: {
        id: techUser.userId,
        email: techUser.email,
        phone: '555-0199',
        role: UserRole.SERVICE_PROVIDER
      },
      visitRecord: null
    };

    it('assigned technician can fetch visit details with site equipment', async () => {
      vi.spyOn(prisma.visitSchedule, 'findUnique').mockResolvedValue(mockVisit as any);

      const res = await request(app)
        .get('/api/v1/visits/visit-uuid-1')
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('visit-uuid-1');
      expect(res.body.data.site.equipment.length).toBe(1);
    });

    it('rejects an unassigned technician with 403 Forbidden', async () => {
      vi.spyOn(prisma.visitSchedule, 'findUnique').mockResolvedValue(mockVisit as any);

      const res = await request(app)
        .get('/api/v1/visits/visit-uuid-1')
        .set('Authorization', `Bearer ${otherTechToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not assigned to view this visit/i);
    });

    it('returns 404 for a non-existent visit', async () => {
      vi.spyOn(prisma.visitSchedule, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/visits/non-existent-uuid')
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Inspection Submission & Idempotent Sync (POST /api/v1/visits/:id/inspections)', () => {
    const validPayload = {
      idempotencyKey: 'offline-sync-uuid-12345',
      checkInLatitude: 29.7604,
      checkInLongitude: -95.3698,
      checkInAccuracyMeters: 5,
      isGeofenceVerified: true,
      checklistResponses: [
        {
          equipmentId: '11111111-1111-1111-1111-111111111111',
          domainCategory: 'FIRE_EXTINGUISHER',
          responsesJson: {
            'FE-01': true,
            'FE-02': 150,
            'FE-03': true,
            'FE-04': true,
            'FE-06': true
          },
          passedInspection: true
        }
      ]
    };

    const mockVisit = {
      id: 'visit-uuid-1',
      siteId: 'site-uuid-1',
      assignedTechnicianId: techUser.userId,
      status: VisitStatus.ASSIGNED,
      site: {
        id: 'site-uuid-1',
        siteName: 'Metro Life Safety Tower',
        latitude: 29.7604,
        longitude: -95.3698,
        geofenceRadiusMeters: 100,
        equipment: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            siteId: 'site-uuid-1',
            equipmentType: EquipmentType.FIRE_EXTINGUISHER
          }
        ]
      },
      visitRecord: null
    };

    it('successfully processes valid inspection and seals record with SHA-256', async () => {
      vi.spyOn(prisma.visitRecord, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.visitSchedule, 'findUnique').mockResolvedValue(mockVisit as any);
      vi.spyOn(prisma.checklistTemplate, 'findFirst').mockResolvedValue({
        id: 'tpl-1',
        domainCategory: DomainCategory.FIRE_EXTINGUISHER,
        version: 1,
        title: 'Extinguisher Inspection',
        itemsJson: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        serviceId: null
      });

      // Mock $transaction
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const tx = {
          visitRecord: {
            create: vi.fn().mockResolvedValue({ id: 'rec-uuid-1' }),
            findUnique: vi.fn().mockResolvedValue({
              id: 'rec-uuid-1',
              visitScheduleId: 'visit-uuid-1',
              idempotencyKey: validPayload.idempotencyKey,
              recordHash: 'sha256-mock-hash-12345',
              isGeofenceVerified: true,
              checklistResponses: [
                {
                  id: 'resp-1',
                  equipmentId: validPayload.checklistResponses[0].equipmentId,
                  passedInspection: true
                }
              ],
              attachments: []
            })
          },
          checklistResponse: {
            create: vi.fn().mockResolvedValue({ id: 'resp-1' })
          },
          equipment: {
            update: vi.fn().mockResolvedValue({ id: validPayload.checklistResponses[0].equipmentId })
          },
          attachment: {
            create: vi.fn()
          },
          visitSchedule: {
            update: vi.fn().mockResolvedValue({ id: 'visit-uuid-1', status: VisitStatus.COMPLETED })
          }
        };
        return callback(tx);
      });

      const res = await request(app)
        .post('/api/v1/visits/visit-uuid-1/inspections')
        .set('Authorization', `Bearer ${techToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.idempotencyKey).toBe(validPayload.idempotencyKey);
    }, 25000);

    it('rejects submission if equipment does not belong to the visit site', async () => {
      vi.spyOn(prisma.visitRecord, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.visitSchedule, 'findUnique').mockResolvedValue(mockVisit as any);

      const invalidEquipmentPayload = {
        ...validPayload,
        checklistResponses: [
          {
            equipmentId: '99999999-9999-9999-9999-999999999999', // Foreign equipment
            responsesJson: { 'FE-01': true },
            passedInspection: true
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/visits/visit-uuid-1/inspections')
        .set('Authorization', `Bearer ${techToken}`)
        .send(invalidEquipmentPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not registered at site/i);
    });

    it('idempotency: returns existing record without duplicating when key is resent', async () => {
      // Mock existing record in database
      const existingRecord = {
        id: 'rec-uuid-1',
        visitScheduleId: 'visit-uuid-1',
        idempotencyKey: validPayload.idempotencyKey,
        recordHash: 'sha256-mock-hash-12345',
        isGeofenceVerified: true,
        checklistResponses: [],
        attachments: []
      };

      vi.spyOn(prisma.visitRecord, 'findUnique').mockResolvedValue(existingRecord as any);

      const res = await request(app)
        .post('/api/v1/visits/visit-uuid-1/inspections')
        .set('Authorization', `Bearer ${techToken}`)
        .set('Idempotency-Key', validPayload.idempotencyKey)
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.headers['x-cache-lookup']).toBe('HIT');
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('rec-uuid-1');
    });

    it('idempotency: rejects conflict when same key is submitted for a different visit', async () => {
      const existingRecordOtherVisit = {
        id: 'rec-uuid-1',
        visitScheduleId: 'other-visit-uuid-99',
        idempotencyKey: validPayload.idempotencyKey
      };

      vi.spyOn(prisma.visitRecord, 'findUnique').mockResolvedValue(existingRecordOtherVisit as any);

      const res = await request(app)
        .post('/api/v1/visits/visit-uuid-1/inspections')
        .set('Authorization', `Bearer ${techToken}`)
        .send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/different visit/i);
    });
  });
});
