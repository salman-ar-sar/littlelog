import { getDb } from './index';
import { medicineSchema } from './schemas';
import type { Medicine } from './types';
import { medicineFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listMedicines(babyId: string): Promise<Medicine[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM medicines WHERE baby_id = ? ORDER BY name ASC',
    [babyId],
  );
  return rows.map((row) =>
    parseOrThrow(medicineSchema, medicineFromRow(row), `medicine ${String(row.id)}`),
  );
}

export async function getMedicine(id: string): Promise<Medicine | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM medicines WHERE id = ?',
    [id],
  );
  if (!row) return null;
  return parseOrThrow(medicineSchema, medicineFromRow(row), `medicine ${id}`);
}

export async function createMedicine(data: Medicine): Promise<void> {
  const p = parseOrThrow(medicineSchema, data, `medicine ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO medicines (id, baby_id, name, dosage, unit, form, schedule_rule, reminder_times)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.id,
      p.babyId,
      p.name,
      p.dosage,
      p.unit,
      p.form,
      p.scheduleRule ?? null,
      p.reminderTimes ? JSON.stringify(p.reminderTimes) : null,
    ],
  );
  notifyDbChanged();
}

export async function updateMedicine(
  id: string,
  patch: Partial<Omit<Medicine, 'id' | 'babyId'>>,
): Promise<void> {
  const p = parseOrThrow(
    medicineSchema.partial().omit({ id: true, babyId: true }),
    patch,
    `medicine patch ${id}`,
  );
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.name !== undefined) {
    sets.push('name = ?');
    values.push(p.name);
  }
  if (p.dosage !== undefined) {
    sets.push('dosage = ?');
    values.push(p.dosage);
  }
  if (p.unit !== undefined) {
    sets.push('unit = ?');
    values.push(p.unit);
  }
  if (p.form !== undefined) {
    sets.push('form = ?');
    values.push(p.form);
  }
  if (p.scheduleRule !== undefined) {
    sets.push('schedule_rule = ?');
    values.push(p.scheduleRule ?? null);
  }
  if (p.reminderTimes !== undefined) {
    sets.push('reminder_times = ?');
    values.push(p.reminderTimes ? JSON.stringify(p.reminderTimes) : null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(`UPDATE medicines SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  notifyDbChanged();
}

/** Deletes a medicine; doses cascade via FK. */
export async function deleteMedicine(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM medicines WHERE id = ?', [id]);
  notifyDbChanged();
}
