import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';
import { syncManager, generateUUID } from '../sync/syncManager';
import { visitsApi } from '../api/visits.api';

vi.mock('../api/visits.api', () => ({
  visitsApi: {
    submitInspection: vi.fn(),
    getMyAssigned: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    getChecklistTemplates: vi.fn(),
  },
}));

describe('Offline Synchronization & Idempotency Queue (MOD-08 & MOD-10)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.syncQueue.clear();
    await db.checklistDrafts.clear();
  });

  it('generates a valid UUIDv4 idempotency key', () => {
    const key1 = generateUUID();
    const key2 = generateUUID();

    expect(key1).toHaveLength(36);
    expect(key2).toHaveLength(36);
    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('enqueues inspection into IndexedDB with PENDING status and assigned idempotency key', async () => {
    const payload: any = {
      checkInLatitude: 29.76,
      checkInLongitude: -95.36,
      checklistResponses: [{ equipmentId: 'eq-1', passedInspection: true, responsesJson: {} }]
    };

    const key = await syncManager.enqueueInspection('visit-123', payload);

    expect(key).toBeDefined();
    expect(payload.idempotencyKey).toBe(key);

    const queueItems = await db.syncQueue.toArray();
    expect(queueItems.length).toBe(1);
    expect(queueItems[0].visitId).toBe('visit-123');
    expect(queueItems[0].idempotencyKey).toBe(key);
    expect(queueItems[0].status).toBe('PENDING');
  });

  it('synchronizes queued inspection when syncQueueNow is called and marks as SYNCED', async () => {
    vi.mocked(visitsApi.submitInspection).mockResolvedValueOnce({
      id: 'rec-123',
      idempotencyKey: 'test-key-1'
    });

    const payload = {
      idempotencyKey: 'test-key-1',
      checkInLatitude: 29.76,
      checkInLongitude: -95.36,
      checklistResponses: []
    };

    await db.syncQueue.add({
      idempotencyKey: 'test-key-1',
      visitId: 'visit-999',
      payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString()
    });

    const result = await syncManager.syncQueueNow();

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    // Verify submission preserved the exact same idempotency key
    expect(visitsApi.submitInspection).toHaveBeenCalledWith('visit-999', payload, 'test-key-1');

    const queueItems = await db.syncQueue.toArray();
    expect(queueItems[0].status).toBe('SYNCED');
  });

  it('preserves idempotency key and marks status as FAILED when server sync returns error', async () => {
    vi.mocked(visitsApi.submitInspection).mockRejectedValueOnce(new Error('Network gateway timeout'));

    const payload = {
      idempotencyKey: 'persistent-uuid-456',
      checklistResponses: []
    };

    await db.syncQueue.add({
      idempotencyKey: 'persistent-uuid-456',
      visitId: 'visit-777',
      payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString()
    });

    const result = await syncManager.syncQueueNow();

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);

    const queueItems = await db.syncQueue.toArray();
    expect(queueItems[0].status).toBe('FAILED');
    expect(queueItems[0].retryCount).toBe(1);
    expect(queueItems[0].idempotencyKey).toBe('persistent-uuid-456');
    expect(queueItems[0].error).toContain('Network gateway timeout');
  });

  it('SYNC03: retries an already processed submission and marks status as SYNCED on idempotent server response', async () => {
    // Simulate server returning existing sealed record for an already processed idempotent submission
    vi.mocked(visitsApi.submitInspection).mockResolvedValueOnce({
      id: 'existing-sealed-record-789',
      idempotencyKey: 'retry-key-789',
      recordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      message: 'Inspection submission already processed (idempotent response)'
    });

    const payload = {
      idempotencyKey: 'retry-key-789',
      checkInLatitude: 29.76,
      checkInLongitude: -95.36,
      checklistResponses: []
    };

    await db.syncQueue.add({
      idempotencyKey: 'retry-key-789',
      visitId: 'visit-already-processed',
      payload,
      status: 'PENDING',
      retryCount: 1,
      createdAt: new Date().toISOString()
    });

    const result = await syncManager.syncQueueNow();

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    const queueItems = await db.syncQueue.toArray();
    const item = queueItems.find((q) => q.idempotencyKey === 'retry-key-789');
    expect(item).toBeDefined();
    expect(item?.status).toBe('SYNCED');
  });

  it('SYNC04: persists checklist draft to IndexedDB and recovers draft upon browser refresh / reload', async () => {
    const draftKey = 'visit-101_eq-ext-202';
    const draftPayload = {
      id: draftKey,
      visitId: 'visit-101',
      equipmentId: 'eq-ext-202',
      equipmentType: 'FIRE_EXTINGUISHER',
      responsesJson: {
        'FE-01': true,
        'FE-02': 150,
        'FE-03': true,
        'FE-04': true
      },
      passedInspection: true,
      defectNotes: 'Draft pressure gauge verified in green zone',
      photoEvidenceUri: '/uploads/draft-photo-101.png',
      photoEvidenceType: 'image/png',
      updatedAt: new Date().toISOString()
    };

    // Save draft into IndexedDB (simulating field work before browser closure)
    await db.checklistDrafts.put(draftPayload);

    // Simulate browser reload by querying IndexedDB for the visit
    const restoredDrafts = await db.checklistDrafts.where('visitId').equals('visit-101').toArray();

    expect(restoredDrafts).toHaveLength(1);
    const restored = restoredDrafts[0];
    expect(restored.equipmentId).toBe('eq-ext-202');
    expect(restored.responsesJson['FE-02']).toBe(150);
    expect(restored.defectNotes).toBe('Draft pressure gauge verified in green zone');
    expect(restored.photoEvidenceUri).toBe('/uploads/draft-photo-101.png');
    expect(restored.passedInspection).toBe(true);
  });
});
