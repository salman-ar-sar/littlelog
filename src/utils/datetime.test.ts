import { describe, expect, it } from 'vitest';
import { durationText, formatDayLabel, formatRelative } from './datetime';

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
