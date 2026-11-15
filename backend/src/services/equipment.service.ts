import { prisma } from '../db/prisma';
import { CreateEquipmentInput, UpdateEquipmentInput } from '../schemas/equipment.schemas';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { EquipmentType, EquipmentStatus } from '@prisma/client';

export class EquipmentService {
  public static async registerEquipment(
    requestingCustomerId: string,
    input: CreateEquipmentInput,
    isAdmin: boolean = false
  ) {
    const site = await prisma.site.findUnique({
      where: { id: input.siteId }
    });

    if (!site) {
      throw new NotFoundError(`Site with ID "${input.siteId}" not found`);
    }

    if (!isAdmin && site.customerId !== requestingCustomerId) {
      throw new ForbiddenError('Access denied: You cannot register equipment on a site owned by another customer');
    }

    const existingQr = await prisma.equipment.findUnique({
      where: { qrCodeIdentifier: input.qrCodeIdentifier }
    });

    if (existingQr) {
      throw new ConflictError(`Equipment with QR code "${input.qrCodeIdentifier}" already exists`);
    }

    return prisma.equipment.create({
      data: {
        siteId: input.siteId,
        serialNumber: input.serialNumber,
        qrCodeIdentifier: input.qrCodeIdentifier,
        equipmentType: input.equipmentType as EquipmentType,
        specification: input.specification,
        locationInSite: input.locationInSite,
        manufacturingDate: input.manufacturingDate ? new Date(input.manufacturingDate) : undefined,
        status: EquipmentStatus.OPERATIONAL
      }
    });
  }

  public static async getEquipmentForSite(siteId: string, requestingCustomerId?: string, isAdmin: boolean = false) {
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      throw new NotFoundError(`Site with ID "${siteId}" not found`);
    }

    if (!isAdmin && requestingCustomerId && site.customerId !== requestingCustomerId) {
      throw new ForbiddenError('Access denied: You cannot view equipment for another customer\'s site');
    }

    return prisma.equipment.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async getEquipmentByQrCode(qrCodeIdentifier: string) {
    const equipment = await prisma.equipment.findUnique({
      where: { qrCodeIdentifier },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            address: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });

    if (!equipment) {
      throw new NotFoundError(`Equipment with QR identifier "${qrCodeIdentifier}" not found`);
    }

    return equipment;
  }

  public static async updateEquipment(equipmentId: string, input: UpdateEquipmentInput) {
    const existing = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!existing) {
      throw new NotFoundError(`Equipment with ID "${equipmentId}" not found`);
    }

    return prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: input.status as EquipmentStatus | undefined,
        specification: input.specification,
        locationInSite: input.locationInSite,
        lastInspectionDate: input.lastInspectionDate ? new Date(input.lastInspectionDate) : undefined,
        nextInspectionDueDate: input.nextInspectionDueDate ? new Date(input.nextInspectionDueDate) : undefined
      }
    });
  }
}
