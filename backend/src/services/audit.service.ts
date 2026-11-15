import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

export interface RecordAuditEventInput {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  payloadBeforeJson?: unknown;
  payloadAfterJson?: unknown;
}

/**
 * AuditEventService enforces an immutable, append-only operational and security log.
 * In accordance with SEC-011 and data-model.md, audit events can only be inserted
 * and read—never updated or deleted.
 */
export class AuditService {
  public static async log(input: RecordAuditEventInput): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          userId: input.userId ?? undefined,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          ipAddress: input.ipAddress || 'unknown',
          userAgent: input.userAgent || 'unknown',
          payloadBeforeJson: input.payloadBeforeJson ? (input.payloadBeforeJson as Prisma.InputJsonValue) : undefined,
          payloadAfterJson: input.payloadAfterJson ? (input.payloadAfterJson as Prisma.InputJsonValue) : undefined
        }
      });
    } catch (error) {
      // In production or test when DB is disconnected, write to console error without breaking critical caller
      // eslint-disable-next-line no-console
      console.error('[AuditService Warning] Failed to persist audit event:', error);
    }
  }

  public static async getEvents(limit: number = 50, offset: number = 0) {
    return prisma.auditEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' }
    });
  }
}
