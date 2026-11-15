import { prisma } from '../db/prisma';
import { CreateVisitScheduleInput, SubmitInspectionInput } from '../schemas/visit.schemas';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '../utils/errors';
import { VisitStatus, VisitType, UserRole, AuditAction, EquipmentStatus, DomainCategory, AttachmentType, Prisma } from '@prisma/client';
import { computeSha256 } from '../utils/hash';
import { AuditService } from './audit.service';
import { ChecklistService } from './checklist.service';
import { CertificateService } from './certificate.service';

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's mean radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class VisitService {
  public static async createVisitSchedule(input: CreateVisitScheduleInput) {
    const site = await prisma.site.findUnique({
      where: { id: input.siteId }
    });

    if (!site) {
      throw new NotFoundError(`Site "${input.siteId}" not found`);
    }

    return prisma.visitSchedule.create({
      data: {
        siteId: input.siteId,
        contractId: input.contractId || null,
        serviceRequestId: input.serviceRequestId || null,
        assignedTechnicianId: input.assignedTechnicianId || null,
        targetDate: new Date(input.targetDate),
        dueDate: new Date(input.dueDate),
        visitType: input.visitType as VisitType,
        status: input.assignedTechnicianId ? VisitStatus.ASSIGNED : VisitStatus.PLANNED
      }
    });
  }

  public static async getVisitsForSite(siteId: string) {
    return prisma.visitSchedule.findMany({
      where: { siteId },
      include: {
        assignedTechnician: {
          select: { id: true, email: true, phone: true }
        },
        visitRecord: true
      },
      orderBy: { targetDate: 'asc' }
    });
  }

  public static async getVisitsForTechnician(technicianId: string) {
    return prisma.visitSchedule.findMany({
      where: { assignedTechnicianId: technicianId },
      include: {
        site: {
          include: {
            _count: {
              select: { equipment: true }
            }
          }
        },
        contract: true,
        visitRecord: true
      },
      orderBy: { targetDate: 'asc' }
    });
  }

  public static async getVisitById(
    visitScheduleId: string,
    requestingUser?: { userId: string; role: UserRole; customerProfileId?: string }
  ) {
    const visit = await prisma.visitSchedule.findUnique({
      where: { id: visitScheduleId },
      include: {
        site: {
          include: {
            equipment: {
              orderBy: { equipmentType: 'asc' }
            },
            customer: true
          }
        },
        assignedTechnician: {
          select: { id: true, email: true, phone: true, role: true }
        },
        contract: true,
        visitRecord: {
          include: {
            checklistResponses: {
              include: {
                equipment: true,
                template: true
              }
            },
            attachments: true
          }
        }
      }
    });

    if (!visit) {
      throw new NotFoundError(`VisitSchedule "${visitScheduleId}" not found`);
    }

    // Role-based tenant & assignment authorization enforcement
    if (requestingUser) {
      const { role, userId, customerProfileId } = requestingUser;
      if (role === UserRole.CUSTOMER) {
        if (customerProfileId && visit.site.customerId !== customerProfileId) {
          throw new ForbiddenError('Access denied: You cannot view visits for another customer\'s site');
        }
      } else if (role === UserRole.SERVICE_PROVIDER) {
        if (visit.assignedTechnicianId && visit.assignedTechnicianId !== userId) {
          throw new ForbiddenError('Access denied: You are not assigned to view this visit');
        }
      }
    }

    return visit;
  }

  public static async assignTechnician(visitScheduleId: string, technicianId: string) {
    const visit = await prisma.visitSchedule.findUnique({
      where: { id: visitScheduleId }
    });

    if (!visit) {
      throw new NotFoundError(`VisitSchedule "${visitScheduleId}" not found`);
    }

    if (visit.status === VisitStatus.COMPLETED) {
      throw new BadRequestError('Cannot reassign technician for an already completed visit');
    }

    const tech = await prisma.user.findUnique({
      where: { id: technicianId }
    });

    if (!tech) {
      throw new NotFoundError(`Technician User "${technicianId}" not found`);
    }

    return prisma.visitSchedule.update({
      where: { id: visitScheduleId },
      data: {
        assignedTechnicianId: technicianId,
        status: VisitStatus.ASSIGNED
      },
      include: {
        assignedTechnician: {
          select: { id: true, email: true, phone: true }
        }
      }
    });
  }

  public static async updateVisitStatus(visitScheduleId: string, status: VisitStatus) {
    const visit = await prisma.visitSchedule.findUnique({
      where: { id: visitScheduleId }
    });

    if (!visit) {
      throw new NotFoundError(`VisitSchedule "${visitScheduleId}" not found`);
    }

    if (visit.status === VisitStatus.COMPLETED && status !== VisitStatus.COMPLETED) {
      throw new BadRequestError('Cannot revert status of an already completed visit');
    }

    return prisma.visitSchedule.update({
      where: { id: visitScheduleId },
      data: { status }
    });
  }

  /**
   * Idempotent Field Inspection Submission & Synchronization Engine
   */
  public static async submitInspection(
    visitScheduleId: string,
    input: SubmitInspectionInput,
    requestingUser: { userId: string; role: UserRole },
    ipAddress: string,
    userAgent: string
  ) {
    // 1. Idempotency Check: Return existing record if already processed
    const existingRecord = await prisma.visitRecord.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: {
        checklistResponses: {
          include: { equipment: true }
        },
        attachments: true
      }
    });

    if (existingRecord) {
      if (existingRecord.visitScheduleId !== visitScheduleId) {
        throw new ConflictError(
          `Idempotency key "${input.idempotencyKey}" has already been processed for a different visit (${existingRecord.visitScheduleId})`
        );
      }
      return {
        isDuplicate: true,
        record: existingRecord
      };
    }

    // 2. Fetch and Validate Visit Existence and Authorization
    const visit = await prisma.visitSchedule.findUnique({
      where: { id: visitScheduleId },
      include: {
        site: {
          include: { equipment: true }
        },
        visitRecord: true
      }
    });

    if (!visit) {
      throw new NotFoundError(`VisitSchedule "${visitScheduleId}" not found`);
    }

    if (
      requestingUser.role === UserRole.SERVICE_PROVIDER &&
      visit.assignedTechnicianId &&
      visit.assignedTechnicianId !== requestingUser.userId
    ) {
      throw new ForbiddenError('Access denied: You are not the assigned technician for this visit');
    }

    if (visit.visitRecord || visit.status === VisitStatus.COMPLETED) {
      throw new ConflictError(`Visit "${visitScheduleId}" has already been completed with a different record`);
    }

    // 3. Equipment-to-Site Validation
    const siteEquipmentIds = new Set(visit.site.equipment.map((e) => e.id));
    for (const item of input.checklistResponses) {
      if (!siteEquipmentIds.has(item.equipmentId)) {
        throw new BadRequestError(
          `Equipment with ID "${item.equipmentId}" is not registered at site "${visit.site.siteName}"`
        );
      }
    }

    // 4. Geofence Verification (Haversine distance calculation)
    let isGeofenceVerified = false;
    if (visit.site.latitude && visit.site.longitude) {
      const siteLat = Number(visit.site.latitude);
      const siteLon = Number(visit.site.longitude);
      const distance = calculateDistanceMeters(input.checkInLatitude, input.checkInLongitude, siteLat, siteLon);

      isGeofenceVerified = distance <= visit.site.geofenceRadiusMeters;
    } else {
      isGeofenceVerified = input.isGeofenceVerified ?? false;
    }

    // 5. Cryptographic SHA-256 Record Sealing (SEC-007)
    const checkInTimestamp = new Date();
    const signatureHash = input.customerSignatureData ? computeSha256(input.customerSignatureData) : null;
    const attachmentHashes = input.attachments?.map((a) => a.fileHash || computeSha256(a.fileUri)) || [];

    const recordPayload = {
      visitScheduleId,
      technicianId: requestingUser.userId,
      checkInTimestamp: checkInTimestamp.toISOString(),
      checkInLatitude: input.checkInLatitude,
      checkInLongitude: input.checkInLongitude,
      isGeofenceVerified,
      customerSignerName: input.customerSignerName || null,
      customerSignatureHash: signatureHash,
      attachmentHashes,
      checklistResponses: input.checklistResponses.map((r) => ({
        equipmentId: r.equipmentId,
        passedInspection: r.passedInspection,
        defectNotes: r.defectNotes || null,
        responsesJson: r.responsesJson
      }))
    };
    const recordHash = computeSha256(recordPayload);

    // 6. Ensure default ChecklistTemplate rows exist for referenced categories
    const categoryTemplates = new Map<DomainCategory, string>();
    for (const item of input.checklistResponses) {
      const category = (item.domainCategory as DomainCategory) || DomainCategory.FIRE_EXTINGUISHER;
      if (!categoryTemplates.has(category)) {
        const tpl = await ChecklistService.getOrCreateTemplate(category);
        categoryTemplates.set(category, tpl.id);
      }
    }

    // 7. Atomic Transactional Record Creation and Status Propagation
    const createdRecord = await prisma.$transaction(async (tx) => {
      // Create VisitRecord
      const record = await tx.visitRecord.create({
        data: {
          visitScheduleId,
          idempotencyKey: input.idempotencyKey,
          technicianId: requestingUser.userId,
          checkInTimestamp,
          checkInLatitude: new Prisma.Decimal(input.checkInLatitude),
          checkInLongitude: new Prisma.Decimal(input.checkInLongitude),
          checkInAccuracyMeters: input.checkInAccuracyMeters ? new Prisma.Decimal(input.checkInAccuracyMeters) : null,
          isGeofenceVerified,
          geofenceOverrideReason: input.geofenceOverrideReason || null,
          checkOutTimestamp: input.checkOutTimestamp ? new Date(input.checkOutTimestamp) : new Date(),
          customerSignerName: input.customerSignerName || null,
          customerSignatureData: input.customerSignatureData || null,
          technicianNotes: input.technicianNotes || null,
          recordHash,
          syncTimestamp: new Date()
        }
      });

      // Create Checklist Responses
      for (const item of input.checklistResponses) {
        const category = (item.domainCategory as DomainCategory) || DomainCategory.FIRE_EXTINGUISHER;
        const templateId = item.templateId || categoryTemplates.get(category)!;

        await tx.checklistResponse.create({
          data: {
            visitRecordId: record.id,
            equipmentId: item.equipmentId,
            templateId,
            responsesJson: item.responsesJson as unknown as Prisma.InputJsonValue,
            passedInspection: item.passedInspection,
            defectNotes: item.defectNotes || null
          }
        });

        // Update Equipment inspection date and operational status
        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: {
            lastInspectionDate: new Date(),
            status: item.passedInspection ? EquipmentStatus.OPERATIONAL : EquipmentStatus.NEEDS_MAINTENANCE
          }
        });
      }

      // Create Attachments if provided
      if (input.attachments && input.attachments.length > 0) {
        for (const att of input.attachments) {
          const fileHash = att.fileHash || computeSha256(att.fileUri);
          await tx.attachment.create({
            data: {
              visitRecordId: record.id,
              equipmentId: att.equipmentId || null,
              fileType: att.fileType as AttachmentType,
              fileUri: att.fileUri,
              fileHash,
              mimeType: att.mimeType,
              fileSizeBytes: att.fileSizeBytes
            }
          });
        }
      }

      // Mark VisitSchedule as COMPLETED
      await tx.visitSchedule.update({
        where: { id: visitScheduleId },
        data: { status: VisitStatus.COMPLETED }
      });

      return tx.visitRecord.findUnique({
        where: { id: record.id },
        include: {
          checklistResponses: {
            include: { equipment: true }
          },
          attachments: true
        }
      });
    });

    // 8. Log Audit Event
    await AuditService.log({
      userId: requestingUser.userId,
      action: AuditAction.VISIT_COMPLETE,
      entityType: 'VisitRecord',
      entityId: createdRecord?.id || visitScheduleId,
      ipAddress,
      userAgent,
      payloadAfterJson: {
        visitScheduleId,
        idempotencyKey: input.idempotencyKey,
        recordHash,
        checklistCount: input.checklistResponses.length
      }
    });

    // 9. Generate Compliance Certificate with Verification QR code
    let certificate: any = null;
    try {
      const certResult = await CertificateService.generateForVisitRecord(createdRecord?.id || visitScheduleId);
      certificate = certResult.certificate;
    } catch {
      // Best-effort in test/offline environments
    }

    return {
      isDuplicate: false,
      record: {
        ...createdRecord!,
        certificate
      }
    };
  }

  public static async getVisitHistory(user: { userId: string; role: any; customerProfileId?: string; providerProfileId?: string }) {
    const role = user.role;
    let whereClause: any = {};

    if (role === 'CUSTOMER') {
      const customerId = user.customerProfileId || (
        await prisma.customerProfile.findUnique({ where: { userId: user.userId }, select: { id: true } })
      )?.id;
      if (!customerId) return [];
      whereClause = { visitSchedule: { site: { customerId } } };
    } else if (role === 'SERVICE_PROVIDER') {
      whereClause = { visitSchedule: { assignedTechnicianId: user.userId } };
    } else if (role === 'SERVICE_MANAGER') {
      const providerId = user.providerProfileId || (
        await prisma.providerProfile.findUnique({ where: { userId: user.userId }, select: { id: true } })
      )?.id;
      if (!providerId) return [];
      whereClause = { visitSchedule: { contract: { providerId } } };
    } else if (role === 'ADMIN') {
      whereClause = {};
    }

    return prisma.visitRecord.findMany({
      where: whereClause,
      include: {
        visitSchedule: {
          include: {
            site: { select: { id: true, siteName: true, address: true, city: true } },
            assignedTechnician: { select: { id: true, email: true, phone: true } },
            contract: { select: { id: true, contractNumber: true } }
          }
        },
        checklistResponses: {
          select: { id: true, passedInspection: true }
        }
      },
      orderBy: { checkInTimestamp: 'desc' }
    });
  }
}
