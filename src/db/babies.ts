import { getDb } from './index';
import { babySchema } from './schemas';
import type { Baby } from './types';
import { babyFromRow, parseOrThrow } from './mappers';
import { notifyDbChanged } from './change-bus';

export async function listBabies(): Promise<Baby[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM babies ORDER BY created_at ASC',
  );
  return rows.map((row) => parseOrThrow(babySchema, babyFromRow(row), `baby ${String(row.id)}`));
}

export async function getBaby(id: string): Promise<Baby | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM babies WHERE id = ?',
    [id],
  );
  if (!row) return null;
  return parseOrThrow(babySchema, babyFromRow(row), `baby ${id}`);
}

export async function createBaby(data: Baby): Promise<void> {
  const parsed = parseOrThrow(babySchema, data, `baby ${data.id}`);
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO babies (id, name, photo_uri, date_of_birth, sex, birth_weight_grams, birth_length_cm, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      parsed.id,
      parsed.name,
      parsed.photoUri ?? null,
      parsed.dateOfBirth,
      parsed.sex ?? null,
      parsed.birthWeightGrams ?? null,
      parsed.birthLengthCm ?? null,
      parsed.createdAt,
    ],
  );
  notifyDbChanged();
}

export async function updateBaby(
  id: string,
  patch: Partial<Omit<Baby, 'id' | 'createdAt'>>,
): Promise<void> {
  const patchSchema = babySchema.partial().omit({ id: true, createdAt: true });
  const p = parseOrThrow(patchSchema, patch, `baby patch for ${id}`);
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.name !== undefined) {
    sets.push('name = ?');
    values.push(p.name);
  }
  if (p.photoUri !== undefined) {
    sets.push('photo_uri = ?');
    values.push(p.photoUri ?? null);
  }
  if (p.dateOfBirth !== undefined) {
    sets.push('date_of_birth = ?');
    values.push(p.dateOfBirth);
  }
  if (p.sex !== undefined) {
    sets.push('sex = ?');
    values.push(p.sex ?? null);
  }
  if (p.birthWeightGrams !== undefined) {
    sets.push('birth_weight_grams = ?');
    values.push(p.birthWeightGrams ?? null);
  }
  if (p.birthLengthCm !== undefined) {
    sets.push('birth_length_cm = ?');
    values.push(p.birthLengthCm ?? null);
  }
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(`UPDATE babies SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  notifyDbChanged();
}

export async function deleteBaby(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM babies WHERE id = ?', [id]);
  notifyDbChanged();
}
