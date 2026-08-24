import { getDb } from './index';
import { medicineDoseEntrySchema } from './schemas';
import type { MedicineDoseEntry } from './types';
import { doseFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listDoses(
  babyId: string,
  medicineId?: string,
): Promise<MedicineDoseEntry[]> {
  const db = await getDb();
  const rows = medicineId
    ? await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM medicine_dose_entries WHERE baby_id = ? AND medicine_id = ? ORDER BY timestamp DESC',
        [babyId, medicineId],
      )
    : await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM medicine_dose_entries WHERE baby_id = ? ORDER BY timestamp DESC',
        [babyId],
      );
  return rows.map((row) =>
    parseOrThrow(medicineDoseEntrySchema, doseFromRow(row), `dose ${String(row.id)}`),
  );
}

export async function createDose(data: MedicineDoseEntry): Promise<void> {
  const p = parseOrThrow(medicineDoseEntrySchema, data, `dose ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO medicine_dose_entries (id, baby_id, medicine_id, timestamp, amount, note) VALUES (?, ?, ?, ?, ?, ?)',
    [p.id, p.babyId, p.medicineId, p.timestamp, p.amount, p.note ?? null],
  );
  notifyDbChanged();
}

export async function updateDose(
  id: string,
  patch: Partial<Omit<MedicineDoseEntry, 'id' | 'babyId' | 'medicineId'>>,
): Promise<void> {
  const p = parseOrThrow(
    medicineDoseEntrySchema.partial().omit({ id: true, babyId: true, medicineId: true }),
    patch,
    `dose patch ${id}`,
  );
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.timestamp !== undefined) {
    sets.push('timestamp = ?');
    values.push(p.timestamp);
  }
  if (p.amount !== undefined) {
    sets.push('amount = ?');
    values.push(p.amount);
  }
  if (p.note !== undefined) {
    sets.push('note = ?');
    values.push(p.note ?? null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE medicine_dose_entries SET ${sets.join(', ')} WHERE id = ?`,
    [...values, id],
  );
  notifyDbChanged();
}

export async function deleteDose(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM medicine_dose_entries WHERE id = ?', [id]);
  notifyDbChanged();
}
