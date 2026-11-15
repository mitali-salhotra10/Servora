import { prisma } from '../db/prisma';

export const dbRepository = {
  user: prisma.user,
  customerProfile: prisma.customerProfile,
  providerProfile: prisma.providerProfile,
  service: prisma.service,
  serviceRequest: prisma.serviceRequest,
  site: prisma.site,
  contract: prisma.contract,
  equipment: prisma.equipment,
  visitSchedule: prisma.visitSchedule,
  visitRecord: prisma.visitRecord,
  checklistTemplate: prisma.checklistTemplate,
  checklistResponse: prisma.checklistResponse,
  attachment: prisma.attachment,
  certificate: prisma.certificate,
  notificationLog: prisma.notificationLog,
  technicianScore: prisma.technicianScore,
  auditEvent: prisma.auditEvent
};
