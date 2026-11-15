import { db, SyncQueueItem } from '../db';
import { visitsApi } from '../api/visits.api';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class SyncManager {
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncQueueNow();
      });
    }
  }

  public async enqueueInspection(visitId: string, payload: any): Promise<string> {
    const idempotencyKey = payload.idempotencyKey || generateUUID();
    payload.idempotencyKey = idempotencyKey;

    const queueItem: SyncQueueItem = {
      idempotencyKey,
      visitId,
      payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString()
    };

    await db.syncQueue.add(queueItem);

    // Clean up local drafts for this visit
    try {
      const drafts = await db.checklistDrafts.where('visitId').equals(visitId).toArray();
      for (const draft of drafts) {
        await db.checklistDrafts.delete(draft.id);
      }
    } catch {
      // Draft cleanup is best-effort
    }

    this.notifyStatusChange();

    // Trigger immediate sync attempt if device is online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncQueueNow().catch(() => {});
    }

    return idempotencyKey;
  }

  public async syncQueueNow(): Promise<{ succeeded: number; failed: number }> {
    if (this.isSyncing) {
      return { succeeded: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    let succeeded = 0;
    let failed = 0;

    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('PENDING')
        .or('status')
        .equals('FAILED')
        .toArray();

      for (const item of pendingItems) {
        if (!item.id) continue;

        try {
          await db.syncQueue.update(item.id, {
            status: 'SYNCING',
            lastAttempt: new Date().toISOString()
          });
          this.notifyStatusChange();

          // Dispatch to server with original idempotencyKey preserved
          await visitsApi.submitInspection(item.visitId, item.payload, item.idempotencyKey);

          await db.syncQueue.update(item.id, {
            status: 'SYNCED',
            error: undefined
          });

          succeeded++;
        } catch (err: any) {
          failed++;
          const errorMessage = err?.message || 'Network sync failed';

          await db.syncQueue.update(item.id, {
            status: 'FAILED',
            retryCount: item.retryCount + 1,
            error: errorMessage
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }

    return { succeeded, failed };
  }

  public async getPendingCount(): Promise<number> {
    return db.syncQueue
      .where('status')
      .equals('PENDING')
      .or('status')
      .equals('SYNCING')
      .count();
  }

  public async getFailedCount(): Promise<number> {
    return db.syncQueue.where('status').equals('FAILED').count();
  }

  private notifyStatusChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('servora:sync-status-changed'));
    }
  }
}

export const syncManager = new SyncManager();
