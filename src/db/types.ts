import { z } from 'zod';
import {
  babySchema,
  weightEntrySchema,
  feedingEntrySchema,
  sleepEntrySchema,
  diaperEntrySchema,
  bathEntrySchema,
  medicineSchema,
  medicineDoseEntrySchema,
} from './schemas';

export type Sex = z.infer<typeof import('./schemas').sexSchema>;
export type Baby = z.infer<typeof babySchema>;
export type WeightEntry = z.infer<typeof weightEntrySchema>;
export type FeedingMode = z.infer<typeof import('./schemas').feedingModeSchema>;
export type FeedingSide = z.infer<typeof import('./schemas').feedingSideSchema>;
export type BottleType = z.infer<typeof import('./schemas').bottleTypeSchema>;
export type FeedingEntry = z.infer<typeof feedingEntrySchema>;
export type SleepType = z.infer<typeof import('./schemas').sleepTypeSchema>;
export type SleepEntry = z.infer<typeof sleepEntrySchema>;
export type DiaperEntry = z.infer<typeof diaperEntrySchema>;
export type BathEntry = z.infer<typeof bathEntrySchema>;
export type MedicineForm = z.infer<typeof import('./schemas').medicineSchema.shape.form>;
export type Medicine = z.infer<typeof medicineSchema>;
export type MedicineDoseEntry = z.infer<typeof medicineDoseEntrySchema>;

/** Re-export parsers for boundary validation. */
export {
  babySchema,
  weightEntrySchema,
  feedingEntrySchema,
  sleepEntrySchema,
  diaperEntrySchema,
  bathEntrySchema,
  medicineSchema,
  medicineDoseEntrySchema,
};
