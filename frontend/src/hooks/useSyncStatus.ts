import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '../sync/syncManager';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshCounts = useCallback(async () => {
    try {
      const pending = await syncManager.getPendingCount();
      const failed = await syncManager.getFailedCount();
      setPendingCount(pending);
      setFailedCount(failed);
    } catch {
      // IndexedDB might not be open in non-browser envs
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleSyncStatusChange = () => {
      refreshCounts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('servora:sync-status-changed', handleSyncStatusChange);

    refreshCounts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('servora:sync-status-changed', handleSyncStatusChange);
    };
  }, [refreshCounts]);

  const syncNow = async () => {
    setIsSyncing(true);
    try {
      return await syncManager.syncQueueNow();
    } finally {
      setIsSyncing(false);
      refreshCounts();
    }
  };

  return {
    isOnline,
    pendingCount,
    failedCount,
    isSyncing,
    syncNow,
    refreshCounts
  };
}
