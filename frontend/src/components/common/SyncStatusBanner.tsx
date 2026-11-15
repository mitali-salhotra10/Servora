import React from 'react';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export const SyncStatusBanner: React.FC = () => {
  const { isOnline, pendingCount, failedCount, isSyncing, syncNow } = useSyncStatus();

  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className={`px-4 py-2.5 rounded-lg text-xs font-medium flex flex-wrap items-center justify-between gap-3 border shadow-sm transition-all ${
        !isOnline
          ? 'bg-amber-50 text-amber-900 border-amber-200'
          : failedCount > 0
          ? 'bg-red-50 text-red-900 border-red-200'
          : 'bg-blue-50 text-blue-900 border-blue-200'
      }`}
    >
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
        ) : failedCount > 0 ? (
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
        ) : (
          <RefreshCw className={`w-4 h-4 text-blue-600 flex-shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
        )}

        <span>
          {!isOnline
            ? 'Offline Mode — Inspection data is safely stored in local IndexedDB.'
            : isSyncing
            ? 'Synchronizing queued inspections with server...'
            : failedCount > 0
            ? `${failedCount} record(s) failed sync retry. Review queue and tap Sync Now.`
            : `${pendingCount} inspection(s) queued for synchronization.`}
        </span>
      </div>

      {isOnline && (pendingCount > 0 || failedCount > 0) && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 px-2.5 bg-white shadow-none"
          onClick={() => syncNow()}
          isLoading={isSyncing}
        >
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Sync Now
        </Button>
      )}
    </div>
  );
};
