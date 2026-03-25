import { describe, it, expect } from '@jest/globals';
import {
  SyncPayload,
  SyncResponse,
  serializeSyncPayload,
  deserializeSyncPayload,
  serializeSyncResponse,
  deserializeSyncResponse,
} from '../src/sync/protocol.js';
import type { Entry } from '../src/models/entry.js';
import type { Category } from '../src/models/category.js';

describe('sync protocol', () => {
  const entry1: Entry = {
    id: 'e1',
    title: 'GitHub',
    username: 'user@example.com',
    password: 'secret123',
    categoryId: 'work',
    isFavorite: true,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-02T10:00:00Z'),
  };

  const entry2: Entry = {
    id: 'e2',
    title: 'AWS',
    username: 'admin@example.com',
    password: 'awskey456',
    categoryId: 'cloud',
    isFavorite: false,
    createdAt: new Date('2026-01-03T10:00:00Z'),
    updatedAt: new Date('2026-01-03T10:00:00Z'),
    deletedAt: new Date('2026-01-04T10:00:00Z'),
  };

  const category1: Category = {
    id: 'work',
    name: 'Work',
    icon: '💼',
    color: '#3498db',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const category2: Category = {
    id: 'cloud',
    name: 'Cloud',
    icon: '☁️',
    color: '#9b59b6',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: new Date('2026-01-05T00:00:00Z'),
  };

  describe('SyncPayload', () => {
    describe('serializeSyncPayload', () => {
      it('serializes payload to JSON string', () => {
        const payload: SyncPayload = {
          entries: [entry1],
          categories: [category1],
        };

        const json = serializeSyncPayload(payload);

        expect(typeof json).toBe('string');
        const parsed = JSON.parse(json);
        expect(parsed.entries).toHaveLength(1);
        expect(parsed.categories).toHaveLength(1);
      });

      it('serializes dates as ISO strings', () => {
        const payload: SyncPayload = {
          entries: [entry1],
          categories: [category1],
        };

        const json = serializeSyncPayload(payload);
        const parsed = JSON.parse(json);

        expect(parsed.entries[0].createdAt).toBe('2026-01-01T10:00:00.000Z');
        expect(parsed.entries[0].updatedAt).toBe('2026-01-02T10:00:00.000Z');
      });

      it('serializes empty arrays', () => {
        const payload: SyncPayload = {
          entries: [],
          categories: [],
        };

        const json = serializeSyncPayload(payload);
        const parsed = JSON.parse(json);

        expect(parsed.entries).toEqual([]);
        expect(parsed.categories).toEqual([]);
      });

      it('serializes deleted entries with deletedAt', () => {
        const payload: SyncPayload = {
          entries: [entry2],
          categories: [],
        };

        const json = serializeSyncPayload(payload);
        const parsed = JSON.parse(json);

        expect(parsed.entries[0].deletedAt).toBe('2026-01-04T10:00:00.000Z');
      });

      it('serializes deleted categories with deletedAt', () => {
        const payload: SyncPayload = {
          entries: [],
          categories: [category2],
        };

        const json = serializeSyncPayload(payload);
        const parsed = JSON.parse(json);

        expect(parsed.categories[0].deletedAt).toBe('2026-01-05T00:00:00.000Z');
      });
    });

    describe('deserializeSyncPayload', () => {
      it('deserializes JSON string to payload', () => {
        const json = JSON.stringify({
          entries: [
            {
              id: 'e1',
              title: 'GitHub',
              username: 'user@example.com',
              password: 'secret123',
              categoryId: 'work',
              isFavorite: true,
              createdAt: '2026-01-01T10:00:00.000Z',
              updatedAt: '2026-01-02T10:00:00.000Z',
            },
          ],
          categories: [
            {
              id: 'work',
              name: 'Work',
              icon: '💼',
              color: '#3498db',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        });

        const payload = deserializeSyncPayload(json);

        expect(payload.entries).toHaveLength(1);
        expect(payload.categories).toHaveLength(1);
        expect(payload.entries[0].id).toBe('e1');
        expect(payload.categories[0].id).toBe('work');
      });

      it('deserializes ISO strings to Date objects', () => {
        const json = JSON.stringify({
          entries: [
            {
              id: 'e1',
              title: 'Test',
              username: 'user',
              password: 'pass',
              categoryId: 'uncategorized',
              isFavorite: false,
              createdAt: '2026-01-01T10:00:00.000Z',
              updatedAt: '2026-01-02T10:00:00.000Z',
            },
          ],
          categories: [],
        });

        const payload = deserializeSyncPayload(json);

        expect(payload.entries[0].createdAt).toBeInstanceOf(Date);
        expect(payload.entries[0].createdAt.toISOString()).toBe('2026-01-01T10:00:00.000Z');
      });

      it('deserializes deletedAt field as Date', () => {
        const json = JSON.stringify({
          entries: [
            {
              id: 'e1',
              title: 'Test',
              username: 'user',
              password: 'pass',
              categoryId: 'uncategorized',
              isFavorite: false,
              createdAt: '2026-01-01T10:00:00.000Z',
              updatedAt: '2026-01-02T10:00:00.000Z',
              deletedAt: '2026-01-03T10:00:00.000Z',
            },
          ],
          categories: [],
        });

        const payload = deserializeSyncPayload(json);

        expect(payload.entries[0].deletedAt).toBeInstanceOf(Date);
        expect(payload.entries[0].deletedAt?.toISOString()).toBe('2026-01-03T10:00:00.000Z');
      });

      it('handles missing deletedAt as undefined', () => {
        const json = JSON.stringify({
          entries: [
            {
              id: 'e1',
              title: 'Test',
              username: 'user',
              password: 'pass',
              categoryId: 'uncategorized',
              isFavorite: false,
              createdAt: '2026-01-01T10:00:00.000Z',
              updatedAt: '2026-01-02T10:00:00.000Z',
            },
          ],
          categories: [],
        });

        const payload = deserializeSyncPayload(json);

        expect(payload.entries[0].deletedAt).toBeUndefined();
      });
    });

    describe('round-trip serialization', () => {
      it('preserves all entry fields through serialize/deserialize', () => {
        const original: SyncPayload = {
          entries: [entry1, entry2],
          categories: [category1, category2],
        };

        const json = serializeSyncPayload(original);
        const restored = deserializeSyncPayload(json);

        expect(restored.entries).toHaveLength(2);
        expect(restored.categories).toHaveLength(2);

        expect(restored.entries[0]).toEqual(entry1);
        expect(restored.entries[1]).toEqual(entry2);
        expect(restored.categories[0]).toEqual(category1);
        expect(restored.categories[1]).toEqual(category2);
      });
    });
  });

  describe('SyncResponse', () => {
    describe('serializeSyncResponse', () => {
      it('serializes response to JSON string', () => {
        const response: SyncResponse = {
          entries: [entry1],
          categories: [category1],
          serverTs: 1704204000000,
        };

        const json = serializeSyncResponse(response);

        expect(typeof json).toBe('string');
        const parsed = JSON.parse(json);
        expect(parsed.entries).toHaveLength(1);
        expect(parsed.categories).toHaveLength(1);
        expect(parsed.serverTs).toBe(1704204000000);
      });

      it('includes serverTs in serialization', () => {
        const response: SyncResponse = {
          entries: [],
          categories: [],
          serverTs: 1234567890000,
        };

        const json = serializeSyncResponse(response);
        const parsed = JSON.parse(json);

        expect(parsed.serverTs).toBe(1234567890000);
      });
    });

    describe('deserializeSyncResponse', () => {
      it('deserializes JSON string to response', () => {
        const json = JSON.stringify({
          entries: [
            {
              id: 'e1',
              title: 'GitHub',
              username: 'user@example.com',
              password: 'secret123',
              categoryId: 'work',
              isFavorite: true,
              createdAt: '2026-01-01T10:00:00.000Z',
              updatedAt: '2026-01-02T10:00:00.000Z',
            },
          ],
          categories: [
            {
              id: 'work',
              name: 'Work',
              icon: '💼',
              color: '#3498db',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          serverTs: 1704204000000,
        });

        const response = deserializeSyncResponse(json);

        expect(response.entries).toHaveLength(1);
        expect(response.categories).toHaveLength(1);
        expect(response.serverTs).toBe(1704204000000);
        expect(response.entries[0].createdAt).toBeInstanceOf(Date);
      });

      it('parses dates in entries and categories', () => {
        const json = JSON.stringify({
          entries: [
            {
              id: 'e1',
              title: 'Test',
              username: 'user',
              password: 'pass',
              categoryId: 'uncategorized',
              isFavorite: false,
              createdAt: '2026-02-01T12:00:00.000Z',
              updatedAt: '2026-02-02T12:00:00.000Z',
              deletedAt: '2026-02-03T12:00:00.000Z',
            },
          ],
          categories: [
            {
              id: 'cat1',
              name: 'Cat',
              icon: '📁',
              color: '#fff',
              updatedAt: '2026-02-01T00:00:00.000Z',
              deletedAt: '2026-02-02T00:00:00.000Z',
            },
          ],
          serverTs: 1704204000000,
        });

        const response = deserializeSyncResponse(json);

        expect(response.entries[0].createdAt).toBeInstanceOf(Date);
        expect(response.entries[0].updatedAt).toBeInstanceOf(Date);
        expect(response.entries[0].deletedAt).toBeInstanceOf(Date);
        expect(response.categories[0].updatedAt).toBeInstanceOf(Date);
        expect(response.categories[0].deletedAt).toBeInstanceOf(Date);
      });
    });

    describe('round-trip serialization', () => {
      it('preserves all response fields through serialize/deserialize', () => {
        const original: SyncResponse = {
          entries: [entry1, entry2],
          categories: [category1, category2],
          serverTs: 1704204000000,
        };

        const json = serializeSyncResponse(original);
        const restored = deserializeSyncResponse(json);

        expect(restored.entries).toEqual(original.entries);
        expect(restored.categories).toEqual(original.categories);
        expect(restored.serverTs).toBe(original.serverTs);
      });
    });
  });
});
