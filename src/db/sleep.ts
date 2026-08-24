import { getDb } from './index';
import { sleepEntrySchema } from './schemas';
import type { SleepEntry } from './types';
import { sleepFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listSleep(babyId: string): Promise<SleepEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sleep_entries WHERE baby_id = ? ORDER BY start_time DESC',
    [babyId],
  );
  return rows.map((row) =>
    parseOrThrow(sleepEntrySchema, sleepFromRow(row), `sleep ${String(row.id)}`),
  );
}

/** The in-progress sleep entry (end_time IS NULL), if any. */
export async function getActiveSleep(babyId: string): Promise<SleepEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM sleep_entries WHERE baby_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1",
    [babyId],
  );
  if (!row) return null;
  return parseOrThrow(sleepEntrySchema, sleepFromRow(row), `active sleep ${String(row.id)}`);
}

export async function createSleep(data: SleepEntry): Promise<void> {
  const p = parseOrThrow(sleepEntrySchema, data, `sleep ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO sleep_entries (id, baby_id, start_time, end_time, type, note) VALUES (?, ?, ?, ?, ?, ?)',
    [p.id, p.babyId, p.startTime, p.endTime ?? null, p.type, p.note ?? null],
  );
  notifyDbChanged();
}

export async function updateSleep(
  id: string,
  patch: Partial<Omit<SleepEntry, 'id' | 'babyId'>>,
): Promise<void> {
  const p = parseOrThrow(
    sleepEntrySchema.partial().omit({ id: true, babyId: true }),
    patch,
    `sleep patch ${id}`,
  );
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.startTime !== undefined) {
    sets.push('start_time = ?');
    values.push(p.startTime);
  }
  if (p.endTime !== undefined) {
    sets.push('end_time = ?');
    values.push(p.endTime);
  }
  if (p.type !== undefined) {
    sets.push('type = ?');
    values.push(p.type);
  }
  if (p.note !== undefined) {
    sets.push('note = ?');
    values.push(p.note ?? null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(`UPDATE sleep_entries SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  notifyDbChanged();
}

/** End an in-progress sleep. */
export async function endSleep(id: string, endTime: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sleep_entries SET end_time = ? WHERE id = ?', [endTime, id]);
  notifyDbChanged();
}

export async function deleteSleep(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sleep_entries WHERE id = ?', [id]);
  notifyDbChanged();
}
