import { describe, expect, it, vi } from 'vitest';
import { syncQueuedSessions, type SyncDeps } from './syncQueue';
import type { QueuedSession } from './offlineQueue';

function makeItem(overrides: Partial<QueuedSession> = {}): QueuedSession {
  return {
    id: 'session-1',
    user_id: 'user-1',
    session_date: '2026-01-01',
    class_type: 'gi',
    duration_minutes: 60,
    intensity: 3,
    notes: '',
    technique_ids: [],
    created_at: 0,
    ...overrides,
  };
}

function makeDeps(items: QueuedSession[], overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    getQueued: vi.fn().mockResolvedValue(items),
    remove: vi.fn().mockResolvedValue(undefined),
    insertSession: vi.fn().mockResolvedValue({ error: null }),
    insertTechniques: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('syncQueuedSessions', () => {
  it('uploads each queued item and removes it once confirmed', async () => {
    const items = [makeItem({ id: 'a', created_at: 1 }), makeItem({ id: 'b', created_at: 2 })];
    const deps = makeDeps(items);

    const { synced } = await syncQueuedSessions(deps);

    expect(synced).toEqual(['a', 'b']);
    expect(deps.insertSession).toHaveBeenCalledTimes(2);
    expect(deps.remove).toHaveBeenCalledWith('a');
    expect(deps.remove).toHaveBeenCalledWith('b');
  });

  it('processes items oldest first', async () => {
    const items = [makeItem({ id: 'newer', created_at: 2 }), makeItem({ id: 'older', created_at: 1 })];
    const deps = makeDeps(items);

    await syncQueuedSessions(deps);

    const insertedOrder = (deps.insertSession as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0].id);
    expect(insertedOrder).toEqual(['newer', 'older']);
  });

  it('links techniques only after a successful session insert', async () => {
    const items = [makeItem({ id: 'a', technique_ids: ['t1', 't2'] })];
    const deps = makeDeps(items);

    await syncQueuedSessions(deps);

    expect(deps.insertTechniques).toHaveBeenCalledWith('a', 'user-1', ['t1', 't2']);
  });

  it('treats a duplicate-key error as already synced, without re-linking techniques', async () => {
    const items = [makeItem({ id: 'a', technique_ids: ['t1'] })];
    const deps = makeDeps(items, {
      insertSession: vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } }),
    });

    const { synced } = await syncQueuedSessions(deps);

    expect(synced).toEqual(['a']);
    expect(deps.remove).toHaveBeenCalledWith('a');
    expect(deps.insertTechniques).not.toHaveBeenCalled();
  });

  it('stops on the first real error and leaves later items queued', async () => {
    const items = [
      makeItem({ id: 'a', created_at: 1 }),
      makeItem({ id: 'b', created_at: 2 }),
      makeItem({ id: 'c', created_at: 3 }),
    ];
    const insertSession = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'network error' } });
    const deps = makeDeps(items, { insertSession });

    const { synced } = await syncQueuedSessions(deps);

    expect(synced).toEqual(['a']);
    expect(deps.remove).toHaveBeenCalledTimes(1);
    expect(deps.remove).toHaveBeenCalledWith('a');
    expect(insertSession).toHaveBeenCalledTimes(2);
  });

  it('stops without removing anything if the first insert throws', async () => {
    const items = [makeItem({ id: 'a' })];
    const deps = makeDeps(items, { insertSession: vi.fn().mockRejectedValue(new Error('offline')) });

    const { synced } = await syncQueuedSessions(deps);

    expect(synced).toEqual([]);
    expect(deps.remove).not.toHaveBeenCalled();
  });

  it('does nothing when the queue is empty', async () => {
    const deps = makeDeps([]);

    const { synced } = await syncQueuedSessions(deps);

    expect(synced).toEqual([]);
    expect(deps.insertSession).not.toHaveBeenCalled();
  });
});
