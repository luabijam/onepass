import type { Entry } from '../models/entry.js';
import type { Category } from '../models/category.js';

export interface SyncPayload {
  entries: Entry[];
  categories: Category[];
}

export interface SyncResponse {
  entries: Entry[];
  categories: Category[];
  serverTs: number;
}

interface SerializedEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  categoryId: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface SerializedCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: string;
  deletedAt?: string;
}

interface SerializedSyncPayload {
  entries: SerializedEntry[];
  categories: SerializedCategory[];
}

interface SerializedSyncResponse {
  entries: SerializedEntry[];
  categories: SerializedCategory[];
  serverTs: number;
}

function serializeEntry(entry: Entry): SerializedEntry {
  const result: SerializedEntry = {
    id: entry.id,
    title: entry.title,
    username: entry.username,
    password: entry.password,
    categoryId: entry.categoryId,
    isFavorite: entry.isFavorite,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };

  if (entry.url !== undefined) result.url = entry.url;
  if (entry.notes !== undefined) result.notes = entry.notes;
  if (entry.deletedAt !== undefined) result.deletedAt = entry.deletedAt.toISOString();

  return result;
}

function deserializeEntry(data: SerializedEntry): Entry {
  const result: Entry = {
    id: data.id,
    title: data.title,
    username: data.username,
    password: data.password,
    categoryId: data.categoryId,
    isFavorite: data.isFavorite,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };

  if (data.url !== undefined) result.url = data.url;
  if (data.notes !== undefined) result.notes = data.notes;
  if (data.deletedAt !== undefined) result.deletedAt = new Date(data.deletedAt);

  return result;
}

function serializeCategory(category: Category): SerializedCategory {
  const result: SerializedCategory = {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    updatedAt: category.updatedAt.toISOString(),
  };

  if (category.deletedAt !== undefined) {
    result.deletedAt = category.deletedAt.toISOString();
  }

  return result;
}

function deserializeCategory(data: SerializedCategory): Category {
  const result: Category = {
    id: data.id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    updatedAt: new Date(data.updatedAt),
  };

  if (data.deletedAt !== undefined) {
    result.deletedAt = new Date(data.deletedAt);
  }

  return result;
}

export function serializeSyncPayload(payload: SyncPayload): string {
  const data: SerializedSyncPayload = {
    entries: payload.entries.map(serializeEntry),
    categories: payload.categories.map(serializeCategory),
  };
  return JSON.stringify(data);
}

export function deserializeSyncPayload(json: string): SyncPayload {
  const data: SerializedSyncPayload = JSON.parse(json);
  return {
    entries: data.entries.map(deserializeEntry),
    categories: data.categories.map(deserializeCategory),
  };
}

export function serializeSyncResponse(response: SyncResponse): string {
  const data: SerializedSyncResponse = {
    entries: response.entries.map(serializeEntry),
    categories: response.categories.map(serializeCategory),
    serverTs: response.serverTs,
  };
  return JSON.stringify(data);
}

export function deserializeSyncResponse(json: string): SyncResponse {
  const data: SerializedSyncResponse = JSON.parse(json);
  return {
    entries: data.entries.map(deserializeEntry),
    categories: data.categories.map(deserializeCategory),
    serverTs: data.serverTs,
  };
}
