import { getDb } from './index';
import { bathEntrySchema } from './schemas';
import type { BathEntry } from './types';
import { bathFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listBaths(babyId: string): Promise<BathEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM bath_entries WHERE baby_id = ? ORDER BY timestamp DESC',
    [babyId],
  );
  return rows.map((row) =>
    parseOrThrow(bathEntrySchema, bathFromRow(row), `bath ${String(row.id)}`),
  );
}

export async function createBath(data: BathEntry): Promise<void> {
  const p = parseOrThrow(bathEntrySchema, data, `bath ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO bath_entries (id, baby_id, timestamp, note) VALUES (?, ?, ?, ?)',
    [p.id, p.babyId, p.timestamp, p.note ?? null],
  );
  notifyDbChanged();
}

export async function updateBath(
  id: string,
  patch: Partial<Omit<BathEntry, 'id' | 'babyId'>>,
): Promise<void> {
  const p = parseOrThrow(
    bathEntrySchema.partial().omit({ id: true, babyId: true }),
    patch,
    `bath patch ${id}`,
  );
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.timestamp !== undefined) {
    sets.push('timestamp = ?');
    values.push(p.timestamp);
  }
  if (p.note !== undefined) {
    sets.push('note = ?');
    values.push(p.note ?? null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(`UPDATE bath_entries SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  notifyDbChanged();
}

export async function deleteBath(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM bath_entries WHERE id = ?', [id]);
  notifyDbChanged();
}
