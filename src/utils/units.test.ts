import { describe, expect, it } from 'vitest';
import {
  formatVolumeMl,
  formatWeight,
  parseVolumeToMl,
  parseWeightToGrams,
  volumeToDisplay,
  weightToDisplay,
} from './units';

describe('weight conversions', () => {
  it('formats kg with trimmed decimals', () => {
    expect(formatWeight(4250, 'kg')).toBe('4.25 kg');
    expect(formatWeight(4200, 'kg')).toBe('4.2 kg');
    expect(formatWeight(4000, 'kg')).toBe('4 kg');
  });

  it('formats lb at 1dp', () => {
    expect(formatWeight(4535.9237, 'lb')).toBe('10 lb');
    expect(formatWeight(3000, 'lb')).toBe('6.6 lb');
  });

  it('round-trips within epsilon', () => {
    for (const g of [2500, 3400, 5123, 9876]) {
      for (const unit of ['kg', 'lb'] as const) {
        const parsed = parseWeightToGrams(weightToDisplay(g, unit), unit);
        expect(Math.abs(parsed - g)).toBeLessThan(g * 0.01 + 1);
      }
    }
  });
});

describe('volume conversions', () => {
  it('formats ml whole numbers', () => {
    expect(formatVolumeMl(150, 'ml')).toBe('150 ml');
    expect(formatVolumeMl(60.4, 'ml')).toBe('60 ml');
  });

  it('formats oz at 1dp', () => {
    expect(formatVolumeMl(29.5735, 'oz')).toBe('1 oz');
    expect(formatVolumeMl(120, 'oz')).toBe('4.1 oz');
  });

  it('round-trips within epsilon', () => {
    for (const ml of [30, 90, 150, 240]) {
      for (const unit of ['ml', 'oz'] as const) {
        const parsed = parseVolumeToMl(volumeToDisplay(ml, unit), unit);
        expect(Math.abs(parsed - ml)).toBeLessThan(ml * 0.02 + 0.5);
      }
    }
  });
});
