import { useState, useCallback } from 'react';
import type { SyncStatus } from '../components/SyncStatusIndicator';

export interface SyncStatusState {
  status: SyncStatus;
  errorMessage: string | null;
  lastSyncTime: Date | null;
}

export interface UseSyncStatusReturn extends SyncStatusState {
  setSyncing: () => void;
  setSuccess: () => void;
  setError: (message: string) => void;
  setIdle: () => void;
  setStatus: (status: SyncStatus) => void;
  setLastSyncTime: (time: Date | null) => void;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const setSyncing = useCallback(() => {
    setStatus('syncing');
    setErrorMessage(null);
  }, []);

  const setSuccess = useCallback(() => {
    setStatus('success');
    setErrorMessage(null);
    setLastSyncTime(new Date());
  }, []);

  const setError = useCallback((message: string) => {
    setStatus('error');
    setErrorMessage(message);
  }, []);

  const setIdle = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const setLastSyncTimeCallback = useCallback((time: Date | null) => {
    setLastSyncTime(time);
  }, []);

  return {
    status,
    errorMessage,
    lastSyncTime,
    setSyncing,
    setSuccess,
    setError,
    setIdle,
    setStatus,
    setLastSyncTime: setLastSyncTimeCallback,
  };
}
