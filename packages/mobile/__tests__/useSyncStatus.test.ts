import { renderHook, act } from '@testing-library/react-native';
import { useSyncStatus } from '../src/hooks/useSyncStatus';
import type { SyncStatus } from '../src/components/SyncStatusIndicator';

describe('useSyncStatus', () => {
  describe('initial state', () => {
    it('starts with idle status', () => {
      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.status).toBe('idle');
    });

    it('starts with no error message', () => {
      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.errorMessage).toBeNull();
    });

    it('starts with no last sync time', () => {
      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.lastSyncTime).toBeNull();
    });
  });

  describe('setSyncing', () => {
    it('sets status to syncing', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setSyncing();
      });

      expect(result.current.status).toBe('syncing');
    });

    it('clears error message when syncing', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setError('Network error');
      });

      act(() => {
        result.current.setSyncing();
      });

      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('setSuccess', () => {
    it('sets status to success', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setSuccess();
      });

      expect(result.current.status).toBe('success');
    });

    it('sets lastSyncTime when success', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setSuccess();
      });

      expect(result.current.lastSyncTime).not.toBeNull();
      expect(result.current.lastSyncTime instanceof Date).toBe(true);
    });

    it('clears error message on success', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setError('Failed');
      });

      act(() => {
        result.current.setSuccess();
      });

      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('setError', () => {
    it('sets status to error', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setError('Connection refused');
      });

      expect(result.current.status).toBe('error');
    });

    it('stores error message', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setError('Network timeout');
      });

      expect(result.current.errorMessage).toBe('Network timeout');
    });
  });

  describe('setIdle', () => {
    it('sets status to idle', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setSyncing();
      });

      act(() => {
        result.current.setIdle();
      });

      expect(result.current.status).toBe('idle');
    });

    it('clears error message', () => {
      const { result } = renderHook(() => useSyncStatus());

      act(() => {
        result.current.setError('Error');
      });

      act(() => {
        result.current.setIdle();
      });

      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('allows setting any status directly', () => {
      const { result } = renderHook(() => useSyncStatus());

      const statuses: SyncStatus[] = ['idle', 'syncing', 'success', 'error'];

      statuses.forEach((status) => {
        act(() => {
          result.current.setStatus(status);
        });
        expect(result.current.status).toBe(status);
      });
    });
  });

  describe('status transitions', () => {
    it('supports full sync cycle', () => {
      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.setSyncing();
      });
      expect(result.current.status).toBe('syncing');

      act(() => {
        result.current.setSuccess();
      });
      expect(result.current.status).toBe('success');
      expect(result.current.lastSyncTime).not.toBeNull();

      act(() => {
        result.current.setSyncing();
      });
      expect(result.current.status).toBe('syncing');

      act(() => {
        result.current.setError('Failed');
      });
      expect(result.current.status).toBe('error');
      expect(result.current.errorMessage).toBe('Failed');
    });
  });
});
