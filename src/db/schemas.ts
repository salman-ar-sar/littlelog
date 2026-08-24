import { z } from 'zod';

const isoTimestamp = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid ISO timestamp' });

export const sexSchema = z.enum(['male', 'female', 'unspecified']);

export const babySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  photoUri: z.string().optional(),
  dateOfBirth: isoTimestamp,
  sex: sexSchema.optional(),
  birthWeightGrams: z.number().positive().optional(),
  birthLengthCm: z.number().positive().optional(),
  createdAt: isoTimestamp,
});

export const weightEntrySchema = z.object({
  id: z.string().min(1),
  babyId: z.string().min(1),
  timestamp: isoTimestamp,
  weightGrams: z.number().positive(),
  note: z.string().optional(),
});

export const feedingModeSchema = z.enum(['breast', 'bottle']);
export const feedingSideSchema = z.enum(['left', 'right', 'both']);
export const bottleTypeSchema = z.enum(['breast_milk', 'formula', 'mixed']);

export const feedingEntrySchema = z
  .object({
    id: z.string().min(1),
    babyId: z.string().min(1),
    timestamp: isoTimestamp,
    mode: feedingModeSchema,
    side: feedingSideSchema.optional(),
    durationSeconds: z.number().int().nonnegative().optional(),
    amountMl: z.number().positive().optional(),
    bottleType: bottleTypeSchema.optional(),
    note: z.string().optional(),
  })
  .refine(
    (v) =>
      v.mode === 'breast'
        ? v.side !== undefined || v.durationSeconds !== undefined
        : v.amountMl !== undefined,
    { message: 'Breast feeds need side/duration; bottle feeds need amount' },
  );

export const sleepTypeSchema = z.enum(['nap', 'night']);

export const sleepEntrySchema = z.object({
  id: z.string().min(1),
  babyId: z.string().min(1),
  startTime: isoTimestamp,
  endTime: isoTimestamp.nullable(),
  type: sleepTypeSchema,
  note: z.string().optional(),
});

export const diaperEntrySchema = z
  .object({
    id: z.string().min(1),
    babyId: z.string().min(1),
    timestamp: isoTimestamp,
    wet: z.boolean(),
    dirty: z.boolean(),
    consistency: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((v) => v.wet || v.dirty, { message: 'Diaper must be wet, dirty, or both' });

export const bathEntrySchema = z.object({
  id: z.string().min(1),
  babyId: z.string().min(1),
  timestamp: isoTimestamp,
  note: z.string().optional(),
});

export const medicineSchema = z.object({
  id: z.string().min(1),
  babyId: z.string().min(1),
  name: z.string().min(1),
  dosage: z.number().positive(),
  unit: z.string().min(1),
  form: z.enum(['drops', 'syrup', 'tablet']),
  scheduleRule: z.string().optional(), // e.g. "every_8_hours" or "times"
  reminderTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).optional(), // ["08:00","16:00"]
});

export const medicineDoseEntrySchema = z.object({
  id: z.string().min(1),
  babyId: z.string().min(1),
  medicineId: z.string().min(1),
  timestamp: isoTimestamp,
  amount: z.number().positive(),
  note: z.string().optional(),
});
