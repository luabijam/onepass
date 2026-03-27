import type { Entry, Category } from '@onepass/vault-core';
import { mergeEntries, mergeCategories, type MergeConflict } from '@onepass/vault-core';
import { SyncClient } from './SyncClient';
import type { SyncError } from './SyncClient';

function isSyncError(error: unknown): error is SyncError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as SyncError).code === 'string' &&
    error instanceof Error
  );
}

export interface SyncFlowConfig {
  client: SyncClient;
  getEntries: (since?: Date) => Promise<Entry[]>;
  getCategories: (since?: Date) => Promise<Category[]>;
  saveEntries: (entries: Entry[]) => Promise<void>;
  saveCategories: (categories: Category[]) => Promise<void>;
  getLastSyncTimestamp: () => Promise<Date | null>;
  setLastSyncTimestamp: (timestamp: Date) => Promise<void>;
}

export interface SyncResult {
  pulledEntries: number;
  pulledCategories: number;
  pushedEntries: number;
  pushedCategories: number;
  serverTs: number;
  conflicts: MergeConflict<Entry | Category>[];
}

export interface PartialSyncResult {
  pulledEntries: number;
  pulledCategories: number;
}

export class SyncFlowError extends Error {
  public readonly partialResult?: PartialSyncResult;

  constructor(
    message: string,
    public readonly code: string,
    public readonly phase: 'pull' | 'push' | 'merge',
    public readonly cause?: Error,
    partialResult?: PartialSyncResult
  ) {
    super(message);
    this.name = 'SyncFlowError';
    this.partialResult = partialResult;
  }
}

export class SyncFlow {
  private config: SyncFlowConfig;

  constructor(config: SyncFlowConfig) {
    this.config = config;
  }

  async sync(): Promise<SyncResult> {
    const lastSync = await this.config.getLastSyncTimestamp();

    const pullResponse = await this.pull(lastSync ?? undefined);

    const localEntries = await this.config.getEntries();
    const localCategories = await this.config.getCategories();

    const mergeResultEntries = mergeEntries(
      new Map(localEntries.map((e) => [e.id, e])),
      pullResponse.entries
    );
    const mergeResultCategories = mergeCategories(
      new Map(localCategories.map((c) => [c.id, c])),
      pullResponse.categories
    );

    const mergedEntriesArray = Array.from(mergeResultEntries.entries.values());
    const mergedCategoriesArray = Array.from(mergeResultCategories.categories.values());

    await this.config.saveEntries(mergedEntriesArray);
    await this.config.saveCategories(mergedCategoriesArray);

    const entriesToPush = lastSync
      ? mergedEntriesArray.filter((e) => e.updatedAt > lastSync)
      : mergedEntriesArray;
    const categoriesToPush = lastSync
      ? mergedCategoriesArray.filter((c) => c.updatedAt > lastSync)
      : mergedCategoriesArray;

    const partialResult: PartialSyncResult = {
      pulledEntries: pullResponse.entries.length,
      pulledCategories: pullResponse.categories.length,
    };

    try {
      const pushResponse = await this.push(entriesToPush, categoriesToPush);

      await this.config.setLastSyncTimestamp(new Date(pushResponse.serverTs));

      return {
        pulledEntries: pullResponse.entries.length,
        pulledCategories: pullResponse.categories.length,
        pushedEntries: entriesToPush.length,
        pushedCategories: categoriesToPush.length,
        serverTs: pushResponse.serverTs,
        conflicts: [...mergeResultEntries.conflicts, ...mergeResultCategories.conflicts],
      };
    } catch (error) {
      if (isSyncError(error)) {
        throw new SyncFlowError(
          `Push failed: ${error.message}`,
          error.code,
          'push',
          error,
          partialResult
        );
      }
      throw new SyncFlowError(
        'Push failed with unknown error',
        'unknown',
        'push',
        error instanceof Error ? error : undefined,
        partialResult
      );
    }
  }

  private async pull(
    since?: Date
  ): Promise<{ entries: Entry[]; categories: Category[]; serverTs: number }> {
    try {
      const response = await this.config.client.pull(since);
      return {
        entries: response.entries,
        categories: response.categories,
        serverTs: response.serverTs,
      };
    } catch (error) {
      if (isSyncError(error)) {
        throw new SyncFlowError(`Pull failed: ${error.message}`, error.code, 'pull', error);
      }
      throw new SyncFlowError(
        'Pull failed with unknown error',
        'unknown',
        'pull',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async push(
    entries: Entry[],
    categories: Category[]
  ): Promise<{ entries: Entry[]; categories: Category[]; serverTs: number }> {
    const response = await this.config.client.push({ entries, categories });
    return {
      entries: response.entries,
      categories: response.categories,
      serverTs: response.serverTs,
    };
  }
}
