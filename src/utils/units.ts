/** Unit conversions + display formatting. Canonical storage: grams and milliliters. */

const LB_PER_GRAM = 1 / 453.59237;
const OZ_PER_ML = 1 / 29.5735;

export type WeightUnit = 'kg' | 'lb';
export type VolumeUnit = 'ml' | 'oz';

/** Numeric display value for weight (kg rounded to 2dp, lb to 1dp). */
export function weightToDisplay(grams: number, unit: WeightUnit): number {
  return unit === 'kg'
    ? round(grams / 1000, 2)
    : round(grams * LB_PER_GRAM, 1);
}

export function formatWeight(grams: number, unit: WeightUnit): string {
  const value = weightToDisplay(grams, unit);
  return `${trimZeros(value)} ${unit}`;
}

/** Numeric display value for volume (ml rounded to whole, oz to 1dp). */
export function volumeToDisplay(ml: number, unit: VolumeUnit): number {
  return unit === 'ml' ? round(ml, 0) : round(ml * OZ_PER_ML, 1);
}

export function formatVolumeMl(ml: number, unit: VolumeUnit): string {
  const value = volumeToDisplay(ml, unit);
  return `${trimZeros(value)} ${unit}`;
}

export function parseWeightToGrams(value: number, unit: WeightUnit): number {
  if (unit === 'kg') return Math.round(value * 1000 * 100) / 100;
  return Math.round(value / LB_PER_GRAM * 100) / 100;
}

export function parseVolumeToMl(value: number, unit: VolumeUnit): number {
  if (unit === 'ml') return Math.round(value);
  return Math.round(value / OZ_PER_ML * 1000) / 1000;
}

function round(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

function trimZeros(value: number): string {
  return String(parseFloat(value.toFixed(2)));
}
