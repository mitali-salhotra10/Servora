import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';
import { UserRole, ContractFrequency, ContractStatus, VisitStatus } from '@prisma/client';
import { signToken } from '../../src/utils/jwt';

describe('Contracts & Visit Scheduling API (MOD-05 & MOD-06)', () => {
  const managerUser = {
    userId: '11111111-1111-4111-a111-111111111111',
    email: 'manager@servora.app',
    role: UserRole.SERVICE_MANAGER,
    tokenVersion: 1
  };

  const customerUser = {
    userId: '22222222-2222-4222-a222-222222222222',
    email: 'customer@servora.app',
    role: UserRole.CUSTOMER,
    tokenVersion: 1
  };

  const managerToken = signToken(managerUser);
  const customerToken = signToken(customerUser);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Contract Creation & Recurring Slot Generation (FR-022 & FR-027)', () => {
    it('Service Manager can create an AMC contract and generate recurring visit slots', async () => {
      vi.spyOn(prisma.contract, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'contract-uuid-1',
          contractNumber: 'AMC-2026-0099',
          status: ContractStatus.ACTIVE,
          frequency: ContractFrequency.QUARTERLY,
          equipment: [],
          visitSchedules: []
        } as unknown as typeof prisma.contract.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      vi.spyOn(prisma.contract, 'create').mockResolvedValue({
        id: 'contract-uuid-1',
        contractNumber: 'AMC-2026-0099',
        customerId: 'cust-prof-1',
        providerId: 'prov-prof-1',
        siteId: 'site-uuid-1',
        frequency: ContractFrequency.QUARTERLY,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        gracePeriodDays: 7,
        status: ContractStatus.ACTIVE,
        termsSummary: 'Quarterly maintenance of all site hydrants and extinguishers',
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as typeof prisma.contract.create extends (args: unknown) => Promise<infer R> ? R : never);

      const createManyVisitsSpy = vi.spyOn(prisma.visitSchedule, 'createMany').mockResolvedValue({ count: 4 });

      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          contractNumber: 'AMC-2026-0099',
          customerId: '11111111-1111-4111-a111-111111111111',
          providerId: '22222222-2222-4222-a222-222222222222',
          siteId: '33333333-3333-4333-a333-333333333333',
          frequency: 'QUARTERLY',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T00:00:00.000Z',
          gracePeriodDays: 7,
          termsSummary: 'Quarterly maintenance of all site hydrants and extinguishers'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contractNumber).toBe('AMC-2026-0099');
      // Confirmed that automated recurring visit slots were created via createMany
      expect(createManyVisitsSpy).toHaveBeenCalled();
    });

    it('Customer cannot create contracts (RBAC restriction)', async () => {
      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          contractNumber: 'AMC-ILLEGAL-01',
          customerId: '11111111-1111-4111-a111-111111111111',
          providerId: '22222222-2222-4222-a222-222222222222',
          siteId: '33333333-3333-4333-a333-333333333333',
          frequency: 'ANNUAL',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T00:00:00.000Z'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Technician Dispatch & Assignment (FR-028)', () => {
    it('Service Manager can assign technician to a scheduled visit', async () => {
      vi.spyOn(prisma.visitSchedule, 'findUnique').mockResolvedValue({
        id: '11111111-1111-4111-a111-111111111111',
        status: VisitStatus.PLANNED,
        siteId: '33333333-3333-4333-a333-333333333333'
      } as unknown as typeof prisma.visitSchedule.findUnique extends (args: unknown) => Promise<infer R> ? R : never);

      vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args) => {
        if (args.where.id === managerUser.userId) {
          return {
            id: managerUser.userId,
            email: managerUser.email,
            role: managerUser.role,
            tokenVersion: 1,
            isActive: true
          } as unknown as typeof prisma.user.findUnique extends (args: unknown) => Promise<infer R> ? R : never;
        }
        return {
          id: '44444444-4444-4444-a444-444444444444',
          email: 'technician@servora.app',
          role: UserRole.SERVICE_PROVIDER,
          tokenVersion: 1,
          isActive: true
        } as unknown as typeof prisma.user.findUnique extends (args: unknown) => Promise<infer R> ? R : never;
      });

      vi.spyOn(prisma.visitSchedule, 'update').mockResolvedValue({
        id: '11111111-1111-4111-a111-111111111111',
        assignedTechnicianId: '44444444-4444-4444-a444-444444444444',
        status: VisitStatus.ASSIGNED,
        assignedTechnician: {
          id: '44444444-4444-4444-a444-444444444444',
          email: 'technician@servora.app',
          phone: '+919999888877'
        }
      } as unknown as typeof prisma.visitSchedule.update extends (args: unknown) => Promise<infer R> ? R : never);

      const res = await request(app)
        .put('/api/v1/visits/11111111-1111-4111-a111-111111111111/assign')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          technicianId: '44444444-4444-4444-a444-444444444444'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ASSIGNED');
    });
  });
});
