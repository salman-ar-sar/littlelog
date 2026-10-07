import { describe, expect, it } from 'vitest';
import {
  durationText,
  formatDayLabel,
  formatRelative,
  mergeDateFromPicker,
  mergeTimeFromPicker,
} from './datetime';

describe('durationText', () => {
  it('formats under a minute', () => {
    expect(durationText(30)).toBe('30s');
  });

  it('formats minutes', () => {
    expect(durationText(45 * 60)).toBe('45m');
  });

  it('formats hours and minutes', () => {
    expect(durationText(3600 + 24 * 60)).toBe('1h 24m');
    expect(durationText(2 * 3600)).toBe('2h');
  });

  it('clamps negative to zero', () => {
    expect(durationText(-5)).toBe('0s');
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-08-24T12:00:00Z');

  it('says just now under a minute', () => {
    expect(formatRelative('2026-08-24T11:59:30Z', now)).toBe('just now');
  });

  it('formats minutes/hours/days', () => {
    expect(formatRelative('2026-08-24T11:45:00Z', now)).toBe('15m ago');
    expect(formatRelative('2026-08-24T10:00:00Z', now)).toBe('2h ago');
    expect(formatRelative('2026-08-21T10:00:00Z', now)).toBe('3d ago');
  });
});

describe('formatDayLabel', () => {
  const now = new Date('2026-08-24T15:00:00'); // local

  it('labels today and yesterday across midnight', () => {
    expect(formatDayLabel(new Date(now.getTime() - 2 * 3600_000).toISOString(), now)).toBe('Today');
    expect(formatDayLabel(new Date(now.getTime() - 20 * 3600_000).toISOString(), now)).toBe(
      'Yesterday',
    );
  });

  it('falls back to short date beyond yesterday', () => {
    expect(formatDayLabel(new Date(now.getTime() - 5 * 86_400_000).toISOString(), now)).toBe('Aug 19');
  });
});

describe('mergeDateFromPicker', () => {
  it('updates calendar date while preserving local time components', () => {
    const base = new Date(2026, 9, 6, 14, 35, 20); // Oct 6, 2026 14:35:20 local
    const pickerUtcMidnight = new Date(Date.UTC(2026, 9, 15, 0, 0, 0)); // Oct 15 UTC
    const merged = mergeDateFromPicker(base, pickerUtcMidnight);

    expect(merged.getFullYear()).toBe(2026);
    expect(merged.getMonth()).toBe(9);
    expect(merged.getDate()).toBe(15);
    expect(merged.getHours()).toBe(14);
    expect(merged.getMinutes()).toBe(35);
  });
});

describe('mergeTimeFromPicker', () => {
  it('updates local hours and minutes while preserving calendar date', () => {
    const base = new Date(2026, 9, 6, 14, 35, 20); // Oct 6, 2026 14:35:20 local
    const pickerTime = new Date(2026, 9, 6, 9, 45, 0); // 09:45 local
    const merged = mergeTimeFromPicker(base, pickerTime);

    expect(merged.getFullYear()).toBe(2026);
    expect(merged.getMonth()).toBe(9);
    expect(merged.getDate()).toBe(6);
    expect(merged.getHours()).toBe(9);
    expect(merged.getMinutes()).toBe(45);
    expect(merged.getSeconds()).toBe(0);
  });
});
