import type { z } from 'zod';

/** Zod-parse a value or throw with row context. Used at every DB read boundary. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`[db] Invalid ${context} → ${issues}`);
  }
  return result.data;
}

type Row = Record<string, unknown>;

function str(v: unknown): string {
  return v as string;
}

function strOpt(v: unknown): string | undefined {
  return v == null ? undefined : (v as string);
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Expected number, got ${String(v)}`);
  return n;
}

function numOpt(v: unknown): number | undefined {
  return v == null ? undefined : num(v);
}

function bool(v: unknown): boolean {
  return v === 1 || v === true;
}

/* ---------- row → domain mappers (snake_case columns → camelCase fields) ---------- */

export function babyFromRow(row: Row) {
  return {
    id: str(row.id),
    name: str(row.name),
    photoUri: strOpt(row.photo_uri),
    dateOfBirth: str(row.date_of_birth),
    sex: strOpt(row.sex),
    birthWeightGrams: numOpt(row.birth_weight_grams),
    birthLengthCm: numOpt(row.birth_length_cm),
    createdAt: str(row.created_at),
  };
}

export function weightFromRow(row: Row) {
  return {
    id: str(row.id),
    babyId: str(row.baby_id),
    timestamp: str(row.timestamp),
    weightGrams: num(row.weight_grams),
    note: strOpt(row.note),
  };
}

export function feedingFromRow(row: Row) {
  return {
    id: str(row.id),
    babyId: str(row.baby_id),
    timestamp: str(row.timestamp),
    mode: str(row.mode),
    side: strOpt(row.side),
    durationSeconds: numOpt(row.duration_seconds),
    amountMl: numOpt(row.amount_ml),
    bottleType: strOpt(row.bottle_type),
    note: strOpt(row.note),
  };
}

export function sleepFromRow(row: Row) {
  return {
    id: str(row.id),
    babyId: str(row.baby_id),
    startTime: str(row.start_time),
    endTime: row.end_time == null ? null : str(row.end_time),
    type: str(row.type),
    note: strOpt(row.note),
  };
}

export function diaperFromRow(row: Row) {
  return {
    id: str(row.id),
    babyId: str(row.baby_id),
    timestamp: str(row.timestamp),
    wet: bool(row.wet),
    dirty: bool(row.dirty),
    consistency: strOpt(row.consistency),
    note: strOpt(row.note),
  };
}

export function bathFromRow(row: Row) {
  return {
    id: str(row.id),
    babyId: str(row.baby_id),
    timestamp: str(row.timestamp),
    note: strOpt(row.note),
  };
}

export function medicineFromRow(row: Row) {
  let reminderTimes: string[] | undefined;
  if (row.reminder_times != null) {
    try {
      const parsed: unknown = JSON.parse(String(row.reminder_times));
      if (Array.isArray(parsed)) reminderTimes = parsed.map(String);
    } catch {
      reminderTimes = undefined;
    }
  }
  return {
    id: str(row.id),
    babyId: str(row.baby_id),
    name: str(row.name),
    dosage: num(row.dosage),
    unit: str(row.unit),
    form: str(row.form),
    scheduleRule: strOpt(row.schedule_rule),
    reminderTimes,
  };
}

export function doseFromRow(row: Row) {
  return {
    id: str(row.id),
    babyId: str(row.baby_id),
    medicineId: str(row.medicine_id),
    timestamp: str(row.timestamp),
    amount: num(row.amount),
    note: strOpt(row.note),
  };
}
