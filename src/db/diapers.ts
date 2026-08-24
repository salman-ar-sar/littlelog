import { getDb } from './index';
import { diaperEntrySchema } from './schemas';
import type { DiaperEntry } from './types';
import { diaperFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listDiapers(babyId: string): Promise<DiaperEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM diaper_entries WHERE baby_id = ? ORDER BY timestamp DESC',
    [babyId],
  );
  return rows.map((row) =>
    parseOrThrow(diaperEntrySchema, diaperFromRow(row), `diaper ${String(row.id)}`),
  );
}

export async function createDiaper(data: DiaperEntry): Promise<void> {
  const p = parseOrThrow(diaperEntrySchema, data, `diaper ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO diaper_entries (id, baby_id, timestamp, wet, dirty, consistency, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [p.id, p.babyId, p.timestamp, p.wet ? 1 : 0, p.dirty ? 1 : 0, p.consistency ?? null, p.note ?? null],
  );
  notifyDbChanged();
}

export async function updateDiaper(
  id: string,
  patch: Partial<Omit<DiaperEntry, 'id' | 'babyId'>>,
): Promise<void> {
  const p = parseOrThrow(
    diaperEntrySchema.partial().omit({ id: true, babyId: true }),
    patch,
    `diaper patch ${id}`,
  );
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.timestamp !== undefined) {
    sets.push('timestamp = ?');
    values.push(p.timestamp);
  }
  if (p.wet !== undefined) {
    sets.push('wet = ?');
    values.push(p.wet ? 1 : 0);
  }
  if (p.dirty !== undefined) {
    sets.push('dirty = ?');
    values.push(p.dirty ? 1 : 0);
  }
  if (p.consistency !== undefined) {
    sets.push('consistency = ?');
    values.push(p.consistency ?? null);
  }
  if (p.note !== undefined) {
    sets.push('note = ?');
    values.push(p.note ?? null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(`UPDATE diaper_entries SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  notifyDbChanged();
}

export async function deleteDiaper(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM diaper_entries WHERE id = ?', [id]);
  notifyDbChanged();
}
