import { prisma } from '../db/prisma';

/**
 * Scheduled operational background jobs for Servora.
 */
export class BackgroundJobs {
  /**
   * Scans equipment records for overdue inspections and logs compliance alerts.
   */
  public static async checkOverdueInspections(): Promise<number> {
    try {
      const now = new Date();
      const overdueEquipment = await prisma.equipment.findMany({
        where: {
          nextInspectionDueDate: { lt: now },
          status: 'OPERATIONAL'
        },
        select: { id: true, qrCodeIdentifier: true, serialNumber: true }
      });

      if (overdueEquipment.length > 0) {
        // eslint-disable-next-line no-console
        console.info(`[BackgroundJobs] Identified ${overdueEquipment.length} equipment units requiring inspection.`);
      }
      return overdueEquipment.length;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[BackgroundJobs] Error checking overdue inspections:', error);
      return 0;
    }
  }
}
