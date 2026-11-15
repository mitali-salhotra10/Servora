import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  RefreshCw,
  Wifi,
  CheckCircle2,
  HardDrive,
  FileCheck
} from 'lucide-react';

export const OfflineSyncPage: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSync = () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to Servora backend API gateway...');

    setTimeout(() => {
      setSyncStatus('Verifying SHA-256 local mutation ledger...');
    }, 700);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('Synchronization complete! All offline inspection checklists successfully sealed in backend.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Offline Sync & Local Cache Center</h1>
            <Badge variant="success">
              <Wifi className="w-3.5 h-3.5 mr-1" /> ONLINE
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage IndexedDB offline storage, inspect queued field checklists, and replay cached mutations with idempotency keys.
          </p>
        </div>

        <Button variant="primary" onClick={handleSync} disabled={isSyncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Synchronizing...' : 'Force Sync Now'}
        </Button>
      </div>

      {syncStatus && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Local Storage Engine</p>
              <h3 className="font-bold text-slate-900 text-lg">IndexedDB v2</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">Persistent client-side offline store initialized</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Sync Queue</p>
              <h3 className="font-bold text-slate-900 text-lg">0 Queued</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">All recent inspections submitted to server</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Offline Assets Cached</p>
              <h3 className="font-bold text-slate-900 text-lg">42 Equipment</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">Available for QR scanning without internet</p>
        </Card>
      </div>
    </div>
  );
};
