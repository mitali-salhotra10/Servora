import { prisma } from '../db/prisma';
import { CreateServiceRequestInput, UpdateServiceRequestStatusInput } from '../schemas/serviceRequest.schemas';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { UserRole, ServiceRequestStatus } from '@prisma/client';

export class ServiceRequestService {
  /**
   * Customer creates a new service request / defect complaint.
   * Verifies site ownership (tenant boundary).
   */
  public static async create(customerId: string, input: CreateServiceRequestInput) {
    // Tenant Isolation Check: Verify site belongs to customer
    const site = await prisma.site.findUnique({
      where: { id: input.siteId },
      select: { id: true, customerId: true, siteName: true }
    });

    if (!site) {
      throw new NotFoundError(`Facility site with ID "${input.siteId}" not found`);
    }

    if (site.customerId !== customerId) {
      throw new ForbiddenError('Access denied: You do not own this facility site');
    }

    // Check default service offering
    let defaultService = await prisma.service.findFirst({ select: { id: true } });
    if (!defaultService) {
      const provider = await prisma.providerProfile.findFirst({ select: { id: true } });
      if (provider) {
        defaultService = await prisma.service.create({
          data: {
            providerId: provider.id,
            name: 'Standard Life Safety Inspection & Service',
            domainCategory: 'FIRE_EXTINGUISHER' as any,
            description: 'Comprehensive recurring equipment inspection and defect rectification'
          },
          select: { id: true }
        });
      }
    }

    const created = await prisma.serviceRequest.create({
      data: {
        customerId,
        siteId: site.id,
        serviceId: defaultService?.id || '',
        preferredDate: new Date(input.preferredDate),
        preferredTimeSlot: input.preferredTimeSlot,
        customerNotes: `[${input.category} | Urgency: ${input.urgency}] ${input.customerNotes}`,
        status: ServiceRequestStatus.SUBMITTED
      },
      include: { site: { select: { siteName: true } } }
    });

    return {
      id: created.id,
      ticketNumber: `SR-${created.id.slice(0, 8).toUpperCase()}`,
      siteId: created.siteId,
      siteName: created.site.siteName,
      category: input.category,
      urgency: input.urgency,
      status: created.status,
      preferredDate: input.preferredDate,
      customerNotes: input.customerNotes,
      createdAt: created.createdAt.toISOString()
    };
  }

  /**
   * Retrieves service requests filtered by role and tenant ownership.
   */
  public static async getAll(user: { userId: string; role: UserRole; customerProfileId?: string; providerProfileId?: string }) {
    if (user.role === UserRole.CUSTOMER) {
      const customerId = user.customerProfileId || (
        await prisma.customerProfile.findUnique({ where: { userId: user.userId }, select: { id: true } })
      )?.id;

      if (!customerId) {
        return [];
      }

      const list = await prisma.serviceRequest.findMany({
        where: { customerId },
        include: { site: { select: { siteName: true } } },
        orderBy: { createdAt: 'desc' }
      });

      return list.map(r => ({
        id: r.id,
        ticketNumber: `SR-${r.id.slice(0, 8).toUpperCase()}`,
        siteId: r.siteId,
        siteName: r.site.siteName,
        status: r.status,
        preferredDate: r.preferredDate.toISOString().slice(0, 10),
        customerNotes: r.customerNotes,
        createdAt: r.createdAt.toISOString()
      }));
    }

    // Manager, Admin, Technician
    const list = await prisma.serviceRequest.findMany({
      include: { site: { select: { siteName: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return list.map(r => ({
      id: r.id,
      ticketNumber: `SR-${r.id.slice(0, 8).toUpperCase()}`,
      siteId: r.siteId,
      siteName: r.site.siteName,
      status: r.status,
      preferredDate: r.preferredDate.toISOString().slice(0, 10),
      customerNotes: r.customerNotes,
      createdAt: r.createdAt.toISOString()
    }));
  }

  /**
   * Updates status of a service request (e.g. ACCEPTED, SCHEDULED, IN_PROGRESS, RESOLVED, CANCELLED).
   */
  public static async updateStatus(id: string, input: UpdateServiceRequestStatusInput, user: { userId: string; role: UserRole }) {
    if (user.role === UserRole.CUSTOMER && input.status !== 'CANCELLED') {
      throw new ForbiddenError('Customers may only cancel their own pending service requests');
    }

    let prismaStatus: ServiceRequestStatus;
    if (input.status === 'RESOLVED' || input.status === 'COMPLETED') {
      prismaStatus = ServiceRequestStatus.COMPLETED;
    } else if (input.status === 'IN_PROGRESS') {
      prismaStatus = ServiceRequestStatus.SCHEDULED;
    } else {
      prismaStatus = input.status as ServiceRequestStatus;
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: prismaStatus,
        rejectionReason: input.rejectionReason
      },
      include: { site: { select: { siteName: true } } }
    });

    return {
      id: updated.id,
      status: updated.status,
      siteName: updated.site?.siteName || 'Facility Site',
      updatedAt: updated.updatedAt.toISOString()
    };
  }
}
