import { supabase } from '../supabaseClient';
import { getQueuedSessions, removeQueuedSession, type QueuedSession } from './offlineQueue';

type SessionRow = {
  id: string;
  user_id: string;
  session_date: string;
  class_type: string;
  duration_minutes: number;
  intensity: number;
  notes: string;
};

type InsertResult = { error: { code?: string; message: string } | null };

export type SyncDeps = {
  getQueued: () => Promise<QueuedSession[]>;
  remove: (id: string) => Promise<void>;
  insertSession: (row: SessionRow) => Promise<InsertResult>;
  insertTechniques: (sessionId: string, userId: string, techniqueIds: string[]) => Promise<void>;
};

const DUPLICATE_ERROR_CODE = '23505';

const defaultDeps: SyncDeps = {
  getQueued: getQueuedSessions,
  remove: removeQueuedSession,
  insertSession: async (row) => {
    const { error } = await supabase.from('sessions').insert(row);
    return { error: error ? { code: error.code, message: error.message } : null };
  },
  insertTechniques: async (sessionId, userId, techniqueIds) => {
    if (techniqueIds.length === 0) return;
    await supabase
      .from('session_techniques')
      .insert(techniqueIds.map((technique_id) => ({ session_id: sessionId, technique_id, user_id: userId })));
  },
};

/**
 * Uploads queued offline sessions one at a time, oldest first, removing each only once it's
 * confirmed saved. A duplicate-key error means an earlier sync attempt already got it through
 * before being interrupted, so it's treated as synced rather than retried. Any other error
 * stops the run, leaving that item and everything after it queued for the next attempt.
 */
export async function syncQueuedSessions(deps: SyncDeps = defaultDeps): Promise<{ synced: string[] }> {
  const items = await deps.getQueued();
  const synced: string[] = [];

  for (const item of items) {
    const row: SessionRow = {
      id: item.id,
      user_id: item.user_id,
      session_date: item.session_date,
      class_type: item.class_type,
      duration_minutes: item.duration_minutes,
      intensity: item.intensity,
      notes: item.notes,
    };

    let result: InsertResult;
    try {
      result = await deps.insertSession(row);
    } catch {
      break;
    }

    if (result.error && result.error.code !== DUPLICATE_ERROR_CODE) break;

    if (!result.error) {
      await deps.insertTechniques(item.id, item.user_id, item.technique_ids);
    }
    await deps.remove(item.id);
    synced.push(item.id);
  }

  return { synced };
}
