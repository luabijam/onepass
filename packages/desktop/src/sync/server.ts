import express, {Request, Response, NextFunction, Router} from 'express';
import type {
  Entry,
  Category,
  SyncPayload,
  SyncResponse,
} from '@onepass/vault-core';
import {deserializeSyncPayload} from '@onepass/vault-core';

export interface SyncServerConfig {
  token: string;
  getEntries: (since?: Date) => Promise<Entry[]>;
  getCategories: (since?: Date) => Promise<Category[]>;
  mergeChanges: (
    payload: SyncPayload,
  ) => Promise<{entries: Entry[]; categories: Category[]}>;
}

function authMiddleware(validToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({error: 'Missing authorization token'});
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({error: 'Invalid token'});
      return;
    }

    const token = parts[1];
    if (token !== validToken) {
      res.status(401).json({error: 'Invalid token'});
      return;
    }

    next();
  };
}

export function createSyncServer(config: SyncServerConfig) {
  const app = express();
  const router = Router();

  app.use(express.json());

  const auth = authMiddleware(config.token);

  router.get(
    '/sync',
    auth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const sinceParam = req.query.since;
        const since = sinceParam ? new Date(Number(sinceParam)) : undefined;

        const [entries, categories] = await Promise.all([
          config.getEntries(since),
          config.getCategories(since),
        ]);

        const response: SyncResponse = {
          entries,
          categories,
          serverTs: Date.now(),
        };

        res.json(response);
      } catch (error) {
        res.status(500).json({error: 'Internal server error'});
      }
    },
  );

  router.post(
    '/sync',
    auth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const {entries, categories} = req.body;

        if (!Array.isArray(entries) || !Array.isArray(categories)) {
          res.status(400).json({
            error: 'Invalid payload: entries and categories must be arrays',
          });
          return;
        }

        const rawPayload = {entries, categories};
        const payload = deserializeSyncPayload(JSON.stringify(rawPayload));

        const merged = await config.mergeChanges(payload);

        const response: SyncResponse = {
          entries: merged.entries,
          categories: merged.categories,
          serverTs: Date.now(),
        };

        res.json(response);
      } catch (error) {
        res.status(500).json({error: 'Internal server error'});
      }
    },
  );

  app.use('/', router);

  return app.listen(0);
}
