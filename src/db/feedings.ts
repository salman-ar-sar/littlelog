import { getDb } from './index';
import { feedingEntrySchema } from './schemas';
import type { FeedingEntry } from './types';
import { feedingFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listFeedings(babyId: string): Promise<FeedingEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM feeding_entries WHERE baby_id = ? ORDER BY timestamp DESC',
    [babyId],
  );
  return rows.map((row) =>
    parseOrThrow(feedingEntrySchema, feedingFromRow(row), `feeding ${String(row.id)}`),
  );
}

export async function createFeeding(data: FeedingEntry): Promise<void> {
  const p = parseOrThrow(feedingEntrySchema, data, `feeding ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO feeding_entries (id, baby_id, timestamp, mode, side, duration_seconds, amount_ml, bottle_type, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.id,
      p.babyId,
      p.timestamp,
      p.mode,
      p.side ?? null,
      p.durationSeconds ?? null,
      p.amountMl ?? null,
      p.bottleType ?? null,
      p.note ?? null,
    ],
  );
  notifyDbChanged();
}

export async function updateFeeding(
  id: string,
  patch: Partial<Omit<FeedingEntry, 'id' | 'babyId'>>,
): Promise<void> {
  const p = parseOrThrow(
    feedingEntrySchema.partial().omit({ id: true, babyId: true }),
    patch,
    `feeding patch ${id}`,
  );
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.timestamp !== undefined) {
    sets.push('timestamp = ?');
    values.push(p.timestamp);
  }
  if (p.mode !== undefined) {
    sets.push('mode = ?');
    values.push(p.mode);
  }
  if (p.side !== undefined) {
    sets.push('side = ?');
    values.push(p.side ?? null);
  }
  if (p.durationSeconds !== undefined) {
    sets.push('duration_seconds = ?');
    values.push(p.durationSeconds ?? null);
  }
  if (p.amountMl !== undefined) {
    sets.push('amount_ml = ?');
    values.push(p.amountMl ?? null);
  }
  if (p.bottleType !== undefined) {
    sets.push('bottle_type = ?');
    values.push(p.bottleType ?? null);
  }
  if (p.note !== undefined) {
    sets.push('note = ?');
    values.push(p.note ?? null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(`UPDATE feeding_entries SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  notifyDbChanged();
}

export async function deleteFeeding(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM feeding_entries WHERE id = ?', [id]);
  notifyDbChanged();
}
