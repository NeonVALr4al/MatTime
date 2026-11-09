export type QueuedSession = {
  id: string;
  user_id: string;
  session_date: string;
  class_type: string;
  duration_minutes: number;
  intensity: number;
  notes: string;
  technique_ids: string[];
  created_at: number;
};

const DB_NAME = 'mattime-offline';
const DB_VERSION = 1;
const STORE_NAME = 'session_queue';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Saves a session log to the offline queue, stamped with the time it was queued (used to replay in order). */
export async function enqueueSession(entry: Omit<QueuedSession, 'created_at'>): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...entry, created_at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** All queued sessions, oldest first. */
export async function getQueuedSessions(): Promise<QueuedSession[]> {
  const db = await openDb();
  const items = await new Promise<QueuedSession[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as QueuedSession[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return items.sort((a, b) => a.created_at - b.created_at);
}

export async function removeQueuedSession(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
