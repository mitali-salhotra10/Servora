import { prisma } from '../db/prisma';
import { CreateContractInput } from '../schemas/contract.schemas';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { ContractFrequency, ContractStatus, VisitStatus, VisitType } from '@prisma/client';

export class ContractService {
  public static async createContract(input: CreateContractInput) {
    const existing = await prisma.contract.findUnique({
      where: { contractNumber: input.contractNumber }
    });

    if (existing) {
      throw new ConflictError(`Contract with number "${input.contractNumber}" already exists`);
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const gracePeriodDays = input.gracePeriodDays ?? 7;

    const contract = await prisma.contract.create({
      data: {
        contractNumber: input.contractNumber,
        customerId: input.customerId,
        providerId: input.providerId,
        siteId: input.siteId,
        frequency: input.frequency as ContractFrequency,
        startDate,
        endDate,
        gracePeriodDays,
        status: ContractStatus.ACTIVE,
        termsSummary: input.termsSummary || null,
        equipment: input.equipmentIds && input.equipmentIds.length > 0
          ? {
              connect: input.equipmentIds.map((id) => ({ id }))
            }
          : undefined
      }
    });

    // Automatically generate scheduled visit slots according to frequency (FR-027)
    await this.generateRecurringVisitSlots(contract.id, contract.siteId, startDate, endDate, contract.frequency, gracePeriodDays);

    return prisma.contract.findUnique({
      where: { id: contract.id },
      include: {
        equipment: true,
        visitSchedules: true
      }
    });
  }

  public static async generateRecurringVisitSlots(
    contractId: string,
    siteId: string,
    startDate: Date,
    endDate: Date,
    frequency: ContractFrequency,
    gracePeriodDays: number
  ): Promise<void> {
    const intervalMonthsMap: Record<ContractFrequency, number> = {
      MONTHLY: 1,
      QUARTERLY: 3,
      BI_ANNUAL: 6,
      ANNUAL: 12
    };

    const intervalMonths = intervalMonthsMap[frequency] || 12;
    const slots: Array<{
      contractId: string;
      siteId: string;
      targetDate: Date;
      dueDate: Date;
      status: VisitStatus;
      visitType: VisitType;
    }> = [];

    const current = new Date(startDate);
    // Offset first visit by the interval
    current.setMonth(current.getMonth() + intervalMonths);

    while (current <= endDate) {
      const targetDate = new Date(current);
      const dueDate = new Date(targetDate);
      dueDate.setDate(dueDate.getDate() + gracePeriodDays);

      slots.push({
        contractId,
        siteId,
        targetDate,
        dueDate,
        status: VisitStatus.PLANNED,
        visitType: VisitType.RECURRING_MAINTENANCE
      });

      current.setMonth(current.getMonth() + intervalMonths);
    }

    if (slots.length > 0) {
      await prisma.visitSchedule.createMany({
        data: slots
      });
    }
  }

  public static async getContractsForCustomer(customerId: string) {
    return prisma.contract.findMany({
      where: { customerId },
      include: {
        site: true,
        customer: true,
        provider: true,
        _count: {
          select: { visitSchedules: true, equipment: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async getContractsForUser(user: { userId: string; role: any; customerProfileId?: string; providerProfileId?: string }) {
    const role = user.role;
    let whereClause: any = {};

    if (role === 'CUSTOMER') {
      const customerId = user.customerProfileId || (
        await prisma.customerProfile.findUnique({ where: { userId: user.userId }, select: { id: true } })
      )?.id;
      if (!customerId) return [];
      whereClause = { customerId };
    } else if (role === 'SERVICE_MANAGER' || role === 'SERVICE_PROVIDER') {
      const providerId = user.providerProfileId || (
        await prisma.providerProfile.findUnique({ where: { userId: user.userId }, select: { id: true } })
      )?.id;
      if (!providerId) return [];
      whereClause = { providerId };
    } else if (role === 'ADMIN') {
      whereClause = {};
    }

    return prisma.contract.findMany({
      where: whereClause,
      include: {
        site: true,
        customer: true,
        provider: true,
        _count: {
          select: { visitSchedules: true, equipment: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async getContractById(
    contractId: string,
    requestingUser?: { userId: string; role: any; customerProfileId?: string; providerProfileId?: string }
  ) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        site: true,
        customer: true,
        provider: true,
        equipment: true,
        visitSchedules: {
          orderBy: { targetDate: 'asc' }
        }
      }
    });

    if (!contract) {
      throw new NotFoundError(`Contract "${contractId}" not found`);
    }

    // Tenant Isolation Enforcement (SEC-003)
    if (requestingUser) {
      const { role, userId, customerProfileId, providerProfileId } = requestingUser;
      if (role === 'ADMIN') {
        // Platform admin has full access
      } else if (role === 'CUSTOMER') {
        const customerId = customerProfileId || (
          await prisma.customerProfile.findUnique({ where: { userId }, select: { id: true } })
        )?.id;
        if (!customerId || contract.customerId !== customerId) {
          throw new ForbiddenError('Access denied: You do not have permission to view this contract');
        }
      } else if (role === 'SERVICE_PROVIDER' || role === 'SERVICE_MANAGER') {
        const providerId = providerProfileId || (
          await prisma.providerProfile.findUnique({ where: { userId }, select: { id: true } })
        )?.id;
        if (!providerId || contract.providerId !== providerId) {
          throw new ForbiddenError('Access denied: You do not have permission to view this contract');
        }
      }
    }

    return contract;
  }

  public static async updateContractStatus(contractId: string, status: ContractStatus) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new NotFoundError(`Contract "${contractId}" not found`);
    }

    return prisma.contract.update({
      where: { id: contractId },
      data: { status }
    });
  }
}
