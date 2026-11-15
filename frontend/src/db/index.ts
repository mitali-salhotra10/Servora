import Dexie, { Table } from 'dexie';
import { Site } from '../types';

export interface CachedVisit {
  id: string;
  siteId: string;
  contractId?: string | null;
  serviceRequestId?: string | null;
  assignedTechnicianId?: string | null;
  targetDate: string;
  dueDate: string;
  status: string;
  visitType: string;
  site: Site;
  contract?: any;
  visitRecord?: any;
}

export interface CachedEquipment {
  id: string;
  siteId: string;
  serialNumber: string;
  qrCodeIdentifier: string;
  equipmentType: string;
  specification: string;
  locationInSite: string;
  status: string;
  lastInspectionDate?: string | null;
}

export interface ChecklistDraft {
  id: string; // `${visitId}_${equipmentId}`
  visitId: string;
  equipmentId: string;
  equipmentType: string;
  responsesJson: Record<string, any>;
  passedInspection: boolean;
  defectNotes?: string;
  photoEvidenceUri?: string;
  photoEvidenceType?: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id?: number;
  idempotencyKey: string;
  visitId: string;
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastAttempt?: string;
  error?: string;
  createdAt: string;
}

export class ServoraDatabase extends Dexie {
  cachedVisits!: Table<CachedVisit, string>;
  cachedSites!: Table<Site, string>;
  cachedEquipment!: Table<CachedEquipment, string>;
  checklistDrafts!: Table<ChecklistDraft, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('ServoraOfflineDB');
    this.version(1).stores({
      cachedVisits: 'id, assignedTechnicianId, siteId, status, targetDate',
      cachedSites: 'id, customerId, siteName',
      cachedEquipment: 'id, siteId, qrCodeIdentifier, equipmentType, status',
      checklistDrafts: 'id, visitId, equipmentId, updatedAt',
      syncQueue: '++id, idempotencyKey, visitId, status, createdAt'
    });
  }
}

export const db = new ServoraDatabase();
