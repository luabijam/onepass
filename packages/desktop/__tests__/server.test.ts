import request from 'supertest';
import {createSyncServer, SyncServerConfig} from '../src/sync/server';
import type {Entry} from '@onepass/vault-core';
import type {Category} from '@onepass/vault-core';

describe('SyncServer', () => {
  const validToken = 'test-sync-token';
  let server: ReturnType<typeof createSyncServer>;
  let config: SyncServerConfig;

  const mockEntry1: Entry = {
    id: 'e1',
    title: 'GitHub',
    username: 'user@example.com',
    password: 'secret123',
    categoryId: 'work',
    isFavorite: true,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-02T10:00:00Z'),
  };

  const mockEntry2: Entry = {
    id: 'e2',
    title: 'AWS',
    username: 'admin@example.com',
    password: 'awskey456',
    categoryId: 'cloud',
    isFavorite: false,
    createdAt: new Date('2026-01-03T10:00:00Z'),
    updatedAt: new Date('2026-01-04T10:00:00Z'),
  };

  const mockCategory1: Category = {
    id: 'work',
    name: 'Work',
    icon: '💼',
    color: '#3498db',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockCategory2: Category = {
    id: 'cloud',
    name: 'Cloud',
    icon: '☁️',
    color: '#9b59b6',
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  };

  beforeEach(() => {
    config = {
      token: validToken,
      getEntries: jest.fn(),
      getCategories: jest.fn(),
      mergeChanges: jest.fn(),
    };
    server = createSyncServer(config);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('Authentication', () => {
    it('rejects requests without authorization header', async () => {
      const response = await request(server).get('/sync');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({error: 'Missing authorization token'});
    });

    it('rejects requests with invalid token', async () => {
      const response = await request(server)
        .get('/sync')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({error: 'Invalid token'});
    });

    it('accepts requests with valid token', async () => {
      (config.getEntries as jest.Mock).mockResolvedValue([]);
      (config.getCategories as jest.Mock).mockResolvedValue([]);

      const response = await request(server)
        .get('/sync')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    it('rejects requests with malformed authorization header (missing Bearer)', async () => {
      const response = await request(server)
        .get('/sync')
        .set('Authorization', validToken);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({error: 'Invalid token'});
    });

    it('rejects requests with wrong auth scheme', async () => {
      const response = await request(server)
        .get('/sync')
        .set('Authorization', `Basic ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({error: 'Invalid token'});
    });

    it('rejects requests with empty token', async () => {
      const response = await request(server)
        .get('/sync')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({error: 'Invalid token'});
    });

    it('applies authentication to POST /sync endpoint', async () => {
      const response = await request(server)
        .post('/sync')
        .send({entries: [], categories: []});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({error: 'Missing authorization token'});
    });
  });

  describe('GET /sync', () => {
    it('returns all entries and categories when no since parameter', async () => {
      (config.getEntries as jest.Mock).mockResolvedValue([
        mockEntry1,
        mockEntry2,
      ]);
      (config.getCategories as jest.Mock).mockResolvedValue([
        mockCategory1,
        mockCategory2,
      ]);

      const response = await request(server)
        .get('/sync')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entries');
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('serverTs');
      expect(response.body.entries).toHaveLength(2);
      expect(response.body.categories).toHaveLength(2);
      expect(typeof response.body.serverTs).toBe('number');
    });

    it('returns entries updated since timestamp', async () => {
      const since = 1704204000000;
      (config.getEntries as jest.Mock).mockResolvedValue([mockEntry2]);
      (config.getCategories as jest.Mock).mockResolvedValue([mockCategory2]);

      const response = await request(server)
        .get(`/sync?since=${since}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(config.getEntries).toHaveBeenCalledWith(new Date(since));
      expect(response.body.entries).toHaveLength(1);
    });

    it('returns empty arrays when no data', async () => {
      (config.getEntries as jest.Mock).mockResolvedValue([]);
      (config.getCategories as jest.Mock).mockResolvedValue([]);

      const response = await request(server)
        .get('/sync')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toEqual([]);
      expect(response.body.categories).toEqual([]);
    });
  });

  describe('POST /sync', () => {
    it('merges incoming changes and returns updated data', async () => {
      const mergedEntries = [mockEntry1, mockEntry2];
      const mergedCategories = [mockCategory1, mockCategory2];

      (config.mergeChanges as jest.Mock).mockResolvedValue({
        entries: mergedEntries,
        categories: mergedCategories,
      });

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          entries: [mockEntry1],
          categories: [mockCategory1],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entries');
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('serverTs');
      expect(response.body.entries).toHaveLength(2);
      expect(response.body.categories).toHaveLength(2);
    });

    it('calls mergeChanges with correct payload', async () => {
      (config.mergeChanges as jest.Mock).mockResolvedValue({
        entries: [],
        categories: [],
      });

      await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          entries: [mockEntry1],
          categories: [mockCategory1],
        });

      expect(config.mergeChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({id: 'e1'}),
          ]),
          categories: expect.arrayContaining([
            expect.objectContaining({id: 'work'}),
          ]),
        }),
      );
    });

    it('handles empty payload', async () => {
      (config.mergeChanges as jest.Mock).mockResolvedValue({
        entries: [],
        categories: [],
      });

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: []});

      expect(response.status).toBe(200);
    });

    it('returns 400 for invalid payload', async () => {
      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error handling', () => {
    it('returns 500 when getEntries fails', async () => {
      (config.getEntries as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(server)
        .get('/sync')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({error: 'Internal server error'});
    });

    it('returns 500 when mergeChanges fails', async () => {
      (config.mergeChanges as jest.Mock).mockRejectedValue(
        new Error('Merge error'),
      );

      const response = await request(server)
        .post('/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({entries: [], categories: []});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({error: 'Internal server error'});
    });
  });
});
