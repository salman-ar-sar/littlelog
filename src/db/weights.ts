import { getDb } from './index';
import { weightEntrySchema } from './schemas';
import type { WeightEntry } from './types';
import { weightFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listWeights(babyId: string): Promise<WeightEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM weight_entries WHERE baby_id = ? ORDER BY timestamp DESC',
    [babyId],
  );
  return rows.map((row) =>
    parseOrThrow(weightEntrySchema, weightFromRow(row), `weight ${String(row.id)}`),
  );
}

export async function createWeight(data: WeightEntry): Promise<void> {
  const p = parseOrThrow(weightEntrySchema, data, `weight ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO weight_entries (id, baby_id, timestamp, weight_grams, note) VALUES (?, ?, ?, ?, ?)',
    [p.id, p.babyId, p.timestamp, p.weightGrams, p.note ?? null],
  );
  notifyDbChanged();
}

export async function updateWeight(
  id: string,
  patch: Partial<Omit<WeightEntry, 'id' | 'babyId'>>,
): Promise<void> {
  const p = parseOrThrow(
    weightEntrySchema.partial().omit({ id: true, babyId: true }),
    patch,
    `weight patch ${id}`,
  );
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.timestamp !== undefined) {
    sets.push('timestamp = ?');
    values.push(p.timestamp);
  }
  if (p.weightGrams !== undefined) {
    sets.push('weight_grams = ?');
    values.push(p.weightGrams);
  }
  if (p.note !== undefined) {
    sets.push('note = ?');
    values.push(p.note ?? null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(`UPDATE weight_entries SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  notifyDbChanged();
}

export async function deleteWeight(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM weight_entries WHERE id = ?', [id]);
  notifyDbChanged();
}
