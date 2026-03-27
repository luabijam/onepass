import { SyncFlow, SyncFlowError } from '../src/services/SyncFlow';
import type { SyncClient } from '../src/services/SyncClient';
import type { Entry, Category, SyncResponse } from '@onepass/vault-core';

const mockClientPull = jest.fn();
const mockClientPush = jest.fn();

class MockSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

jest.mock('../src/services/SyncClient', () => ({
  SyncClient: jest.fn().mockImplementation(() => ({
    pull: mockClientPull,
    push: mockClientPush,
  })),
  SyncError: MockSyncError,
}));

describe('SyncFlow', () => {
  const mockPull = mockClientPull;
  const mockPush = mockClientPush;

  const createMockClient = (): SyncClient => {
    const client = {
      pull: mockPull,
      push: mockPush,
    } as unknown as SyncClient;
    return client;
  };

  const createEntry = (id: string, title: string, updatedAt: Date): Entry => ({
    id,
    title,
    username: `user-${id}`,
    password: `pass-${id}`,
    categoryId: 'uncategorized',
    isFavorite: false,
    createdAt: new Date('2024-01-01'),
    updatedAt,
  });

  const createCategory = (id: string, name: string, updatedAt: Date): Category => ({
    id,
    name,
    icon: '📁',
    color: '#000000',
    updatedAt,
  });

  const defaultConfig = {
    client: createMockClient(),
    getEntries: jest.fn(),
    getCategories: jest.fn(),
    saveEntries: jest.fn(),
    saveCategories: jest.fn(),
    getLastSyncTimestamp: jest.fn(),
    setLastSyncTimestamp: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPull.mockReset();
    mockPush.mockReset();
  });

  describe('sync', () => {
    it('performs full sync when no last sync timestamp exists', async () => {
      const localEntries = [createEntry('local-1', 'Local Entry', new Date('2024-01-01'))];
      const localCategories = [createCategory('cat-1', 'Work', new Date('2024-01-01'))];

      const pullResponse: SyncResponse = {
        entries: [createEntry('remote-1', 'Remote Entry', new Date('2024-01-02'))],
        categories: [createCategory('cat-2', 'Personal', new Date('2024-01-02'))],
        serverTs: 1704206400000,
      };

      const pushResponse: SyncResponse = {
        entries: [...localEntries, ...pullResponse.entries],
        categories: [...localCategories, ...pullResponse.categories],
        serverTs: 1704206500000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue(localEntries);
      defaultConfig.getCategories.mockResolvedValue(localCategories);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue(pushResponse);

      const syncFlow = new SyncFlow(defaultConfig);
      const result = await syncFlow.sync();

      expect(mockPull).toHaveBeenCalledWith(undefined);
      expect(mockPush).toHaveBeenCalled();
      expect(defaultConfig.saveEntries).toHaveBeenCalled();
      expect(defaultConfig.saveCategories).toHaveBeenCalled();
      expect(defaultConfig.setLastSyncTimestamp).toHaveBeenCalledWith(new Date(1704206500000));

      expect(result.pulledEntries).toBe(1);
      expect(result.pulledCategories).toBe(1);
      expect(result.pushedEntries).toBe(2);
      expect(result.pushedCategories).toBe(2);
    });

    it('performs incremental sync with last sync timestamp', async () => {
      const lastSync = new Date('2024-01-01T00:00:00Z');
      const newerEntry = createEntry('newer-1', 'Newer Entry', new Date('2024-01-02'));
      const olderEntry = createEntry('older-1', 'Older Entry', new Date('2023-12-31'));

      const localEntries = [newerEntry, olderEntry];
      const localCategories: Category[] = [];

      const pullResponse: SyncResponse = {
        entries: [],
        categories: [],
        serverTs: 1704206400000,
      };

      const pushResponse: SyncResponse = {
        entries: [newerEntry],
        categories: [],
        serverTs: 1704206500000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(lastSync);
      defaultConfig.getEntries.mockResolvedValue(localEntries);
      defaultConfig.getCategories.mockResolvedValue(localCategories);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue(pushResponse);

      const syncFlow = new SyncFlow(defaultConfig);
      const result = await syncFlow.sync();

      expect(mockPull).toHaveBeenCalledWith(lastSync);
      expect(result.pushedEntries).toBe(1);
    });

    it('merges remote entries into local', async () => {
      const localEntry = createEntry('entry-1', 'Local Title', new Date('2024-01-01'));
      const remoteEntry = createEntry('entry-1', 'Remote Title Updated', new Date('2024-01-02'));

      const pullResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([localEntry]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue({ entries: [], categories: [], serverTs: 1704206500000 });

      const syncFlow = new SyncFlow(defaultConfig);
      await syncFlow.sync();

      const savedEntries = defaultConfig.saveEntries.mock.calls[0][0];
      expect(savedEntries).toHaveLength(1);
      expect(savedEntries[0].title).toBe('Remote Title Updated');
    });

    it('preserves local entries when newer than remote', async () => {
      const localEntry = createEntry('entry-1', 'Local Newer', new Date('2024-01-03'));
      const remoteEntry = createEntry('entry-1', 'Remote Older', new Date('2024-01-01'));

      const pullResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([localEntry]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue({ entries: [], categories: [], serverTs: 1704206500000 });

      const syncFlow = new SyncFlow(defaultConfig);
      await syncFlow.sync();

      const savedEntries = defaultConfig.saveEntries.mock.calls[0][0];
      expect(savedEntries[0].title).toBe('Local Newer');
    });

    it('adds new remote entries to local', async () => {
      const localEntries: Entry[] = [];
      const remoteEntry = createEntry('remote-1', 'New Remote', new Date('2024-01-01'));

      const pullResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue(localEntries);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue({
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206500000,
      });

      const syncFlow = new SyncFlow(defaultConfig);
      await syncFlow.sync();

      const savedEntries = defaultConfig.saveEntries.mock.calls[0][0];
      expect(savedEntries).toHaveLength(1);
      expect(savedEntries[0].id).toBe('remote-1');
    });

    it('merges remote categories into local', async () => {
      const localCategory = createCategory('cat-1', 'Local Name', new Date('2024-01-01'));
      const remoteCategory = createCategory('cat-1', 'Remote Name Updated', new Date('2024-01-02'));

      const pullResponse: SyncResponse = {
        entries: [],
        categories: [remoteCategory],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([]);
      defaultConfig.getCategories.mockResolvedValue([localCategory]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue({ entries: [], categories: [], serverTs: 1704206500000 });

      const syncFlow = new SyncFlow(defaultConfig);
      await syncFlow.sync();

      const savedCategories = defaultConfig.saveCategories.mock.calls[0][0];
      expect(savedCategories).toHaveLength(1);
      expect(savedCategories[0].name).toBe('Remote Name Updated');
    });

    it('handles deleted entries in merge', async () => {
      const localEntry = createEntry('entry-1', 'Active', new Date('2024-01-01'));
      const remoteEntry: Entry = {
        ...createEntry('entry-1', 'Deleted', new Date('2024-01-02')),
        deletedAt: new Date('2024-01-02'),
      };

      const pullResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([localEntry]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue({ entries: [], categories: [], serverTs: 1704206500000 });

      const syncFlow = new SyncFlow(defaultConfig);
      await syncFlow.sync();

      const savedEntries = defaultConfig.saveEntries.mock.calls[0][0];
      expect(savedEntries[0].deletedAt).toEqual(new Date('2024-01-02'));
    });

    it('handles empty sync (no changes)', async () => {
      const pullResponse: SyncResponse = {
        entries: [],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue({ entries: [], categories: [], serverTs: 1704206500000 });

      const syncFlow = new SyncFlow(defaultConfig);
      const result = await syncFlow.sync();

      expect(result.pulledEntries).toBe(0);
      expect(result.pulledCategories).toBe(0);
      expect(result.pushedEntries).toBe(0);
      expect(result.pushedCategories).toBe(0);
    });
  });

  describe('error handling', () => {
    it('wraps SyncError from pull in SyncFlowError', async () => {
      const syncError = new MockSyncError('Connection refused', 'network');

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      mockPull.mockRejectedValue(syncError);

      const syncFlow = new SyncFlow(defaultConfig);

      await expect(syncFlow.sync()).rejects.toThrow(SyncFlowError);

      try {
        await syncFlow.sync();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncFlowError);
        const flowError = e as SyncFlowError;
        expect(flowError.code).toBe('network');
        expect(flowError.phase).toBe('pull');
        expect(flowError.cause).toBe(syncError);
      }
    });

    it('wraps SyncError from push in SyncFlowError', async () => {
      const syncError = new MockSyncError('Unauthorized', 'unauthorized', 401);

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue({ entries: [], categories: [], serverTs: 1704206400000 });
      mockPush.mockRejectedValue(syncError);

      const syncFlow = new SyncFlow(defaultConfig);

      await expect(syncFlow.sync()).rejects.toThrow(SyncFlowError);

      try {
        await syncFlow.sync();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncFlowError);
        const flowError = e as SyncFlowError;
        expect(flowError.code).toBe('unauthorized');
        expect(flowError.phase).toBe('push');
        expect(flowError.cause).toBe(syncError);
      }
    });

    it('wraps unknown errors from pull', async () => {
      const unknownError = new Error('Something weird happened');

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      mockPull.mockRejectedValue(unknownError);

      const syncFlow = new SyncFlow(defaultConfig);

      await expect(syncFlow.sync()).rejects.toThrow(SyncFlowError);

      try {
        await syncFlow.sync();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncFlowError);
        const flowError = e as SyncFlowError;
        expect(flowError.code).toBe('unknown');
        expect(flowError.phase).toBe('pull');
        expect(flowError.cause).toBe(unknownError);
      }
    });

    it('wraps non-Error objects', async () => {
      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      mockPull.mockRejectedValue('string error');

      const syncFlow = new SyncFlow(defaultConfig);

      await expect(syncFlow.sync()).rejects.toThrow(SyncFlowError);

      try {
        await syncFlow.sync();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncFlowError);
        const flowError = e as SyncFlowError;
        expect(flowError.code).toBe('unknown');
        expect(flowError.phase).toBe('pull');
        expect(flowError.cause).toBeUndefined();
      }
    });
  });

  describe('SyncFlowError', () => {
    it('creates error with all properties', () => {
      const cause = new Error('original error');
      const error = new SyncFlowError('Sync failed', 'network', 'pull', cause);

      expect(error.message).toBe('Sync failed');
      expect(error.code).toBe('network');
      expect(error.phase).toBe('pull');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('SyncFlowError');
    });

    it('creates error without cause', () => {
      const error = new SyncFlowError('Sync failed', 'timeout', 'push');

      expect(error.message).toBe('Sync failed');
      expect(error.code).toBe('timeout');
      expect(error.phase).toBe('push');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('conflict reporting', () => {
    it('reports entry conflicts when local and remote are both modified', async () => {
      const localEntry = createEntry('entry-1', 'Local Modified', new Date('2024-01-02'));
      const remoteEntry: Entry = {
        ...createEntry('entry-1', 'Remote Modified', new Date('2024-01-03')),
        password: 'different-password',
      };

      const pullResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206400000,
      };

      const pushResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206500000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([localEntry]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue(pushResponse);

      const syncFlow = new SyncFlow(defaultConfig);
      const result = await syncFlow.sync();

      expect(result.conflicts).toBeDefined();
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('entry');
      expect(result.conflicts[0].id).toBe('entry-1');
      expect(result.conflicts[0].resolution).toBe('remote');
    });

    it('reports category conflicts when local and remote are both modified', async () => {
      const localCategory = createCategory('cat-1', 'Local Name', new Date('2024-01-02'));
      const remoteCategory: Category = {
        ...createCategory('cat-1', 'Remote Name', new Date('2024-01-03')),
        icon: '📁',
      };

      const pullResponse: SyncResponse = {
        entries: [],
        categories: [remoteCategory],
        serverTs: 1704206400000,
      };

      const pushResponse: SyncResponse = {
        entries: [],
        categories: [remoteCategory],
        serverTs: 1704206500000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([]);
      defaultConfig.getCategories.mockResolvedValue([localCategory]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue(pushResponse);

      const syncFlow = new SyncFlow(defaultConfig);
      const result = await syncFlow.sync();

      expect(result.conflicts).toBeDefined();
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('category');
      expect(result.conflicts[0].id).toBe('cat-1');
    });

    it('reports no conflicts when only new entries are added', async () => {
      const pullResponse: SyncResponse = {
        entries: [createEntry('new-entry', 'New Entry', new Date('2024-01-02'))],
        categories: [],
        serverTs: 1704206400000,
      };

      const pushResponse: SyncResponse = {
        entries: [createEntry('new-entry', 'New Entry', new Date('2024-01-02'))],
        categories: [],
        serverTs: 1704206500000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue(pushResponse);

      const syncFlow = new SyncFlow(defaultConfig);
      const result = await syncFlow.sync();

      expect(result.conflicts).toBeDefined();
      expect(result.conflicts).toHaveLength(0);
    });

    it('reports multiple conflicts', async () => {
      const localEntry1 = createEntry('entry-1', 'Local 1', new Date('2024-01-02'));
      const localEntry2 = createEntry('entry-2', 'Local 2', new Date('2024-01-02'));
      const remoteEntry1: Entry = {
        ...createEntry('entry-1', 'Remote 1', new Date('2024-01-03')),
        password: 'different',
      };
      const remoteEntry2: Entry = {
        ...createEntry('entry-2', 'Remote 2', new Date('2024-01-03')),
        password: 'different',
      };

      const pullResponse: SyncResponse = {
        entries: [remoteEntry1, remoteEntry2],
        categories: [],
        serverTs: 1704206400000,
      };

      const pushResponse: SyncResponse = {
        entries: [remoteEntry1, remoteEntry2],
        categories: [],
        serverTs: 1704206500000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([localEntry1, localEntry2]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockResolvedValue(pushResponse);

      const syncFlow = new SyncFlow(defaultConfig);
      const result = await syncFlow.sync();

      expect(result.conflicts).toHaveLength(2);
    });
  });

  describe('partial sync failure handling', () => {
    it('saves merged data even when push fails', async () => {
      const localEntry = createEntry('local-1', 'Local Entry', new Date('2024-01-01'));
      const remoteEntry = createEntry('remote-1', 'Remote Entry', new Date('2024-01-02'));

      const pullResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([localEntry]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockRejectedValue(new MockSyncError('Push failed', 'network'));

      const syncFlow = new SyncFlow(defaultConfig);

      await expect(syncFlow.sync()).rejects.toThrow(SyncFlowError);

      expect(defaultConfig.saveEntries).toHaveBeenCalled();
      expect(defaultConfig.saveCategories).toHaveBeenCalled();
    });

    it('reports partial success info in error when push fails', async () => {
      const localEntry = createEntry('local-1', 'Local Entry', new Date('2024-01-01'));
      const remoteEntry = createEntry('remote-1', 'Remote Entry', new Date('2024-01-02'));

      const pullResponse: SyncResponse = {
        entries: [remoteEntry],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([localEntry]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockRejectedValue(new MockSyncError('Push failed', 'network'));

      const syncFlow = new SyncFlow(defaultConfig);

      try {
        await syncFlow.sync();
      } catch (error) {
        expect(error).toBeInstanceOf(SyncFlowError);
        const syncError = error as SyncFlowError;
        expect(syncError.partialResult).toBeDefined();
        expect(syncError.partialResult?.pulledEntries).toBe(1);
        expect(syncError.partialResult?.pulledCategories).toBe(0);
      }
    });

    it('does not update last sync timestamp when push fails', async () => {
      const pullResponse: SyncResponse = {
        entries: [],
        categories: [],
        serverTs: 1704206400000,
      };

      defaultConfig.getLastSyncTimestamp.mockResolvedValue(null);
      defaultConfig.getEntries.mockResolvedValue([]);
      defaultConfig.getCategories.mockResolvedValue([]);
      mockPull.mockResolvedValue(pullResponse);
      mockPush.mockRejectedValue(new MockSyncError('Push failed', 'network'));

      const syncFlow = new SyncFlow(defaultConfig);

      await expect(syncFlow.sync()).rejects.toThrow(SyncFlowError);

      expect(defaultConfig.setLastSyncTimestamp).not.toHaveBeenCalled();
    });
  });
});
