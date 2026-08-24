import { describe, expect, it } from 'vitest';
import { formatAge, wholeCalendarMonths } from './age';

const d = (iso: string) => new Date(iso);

describe('formatAge — days', () => {
  it('formats newborn as 0 days', () => {
    const dob = '2026-08-24T00:00:00.000Z';
    // Use local-safe construction: compare with same instant
    expect(formatAge(dob, d(dob))).toBe('0 days old');
  });

  it('handles singular day', () => {
    const dob = d('2026-01-01T12:00:00Z');
    const now = new Date(dob.getTime() + 1 * 86_400_000);
    expect(formatAge(dob.toISOString(), now)).toBe('1 day old');
  });

  it('clamps future DOB to 0 days', () => {
    const now = d('2026-01-01T12:00:00Z');
    const future = new Date(now.getTime() + 5 * 86_400_000);
    expect(formatAge(future.toISOString(), now)).toBe('0 days old');
  });
});

describe('formatAge — boundary at 28 days (days -> weeks)', () => {
  it('27d is still days', () => {
    const dob = d('2026-05-01T12:00:00Z');
    const now = new Date(dob.getTime() + 27 * 86_400_000);
    expect(formatAge(dob.toISOString(), now)).toBe('27 days old');
  });

  it('28d switches to weeks', () => {
    const dob = d('2026-05-01T12:00:00Z');
    const now = new Date(dob.getTime() + 28 * 86_400_000);
    expect(formatAge(dob.toISOString(), now)).toBe('4 weeks old');
  });
});

describe('formatAge — boundary at 70 days (weeks -> months)', () => {
  it('69d is whole weeks', () => {
    const dob = d('2026-03-01T12:00:00Z');
    const now = new Date(dob.getTime() + 69 * 86_400_000); // 9 weeks + 6d
    expect(formatAge(dob.toISOString(), now)).toBe('9 weeks old');
  });

  it('70d switches to months', () => {
    // Jan 15 + 70 days lands around Mar 26 -> 2 completed calendar months.
    const dob = '2026-01-15T12:00:00.000Z';
    const dobDate = d(dob);
    const now = new Date(dobDate.getTime() + 70 * 86_400_000);
    expect(formatAge(dob, now)).toBe('2 months old');
  });
});

describe('formatAge — months', () => {
  it('reports calendar months', () => {
    expect(formatAge(new Date(2026, 0, 10).toISOString(), new Date(2026, 4, 10))).toBe(
      '4 months old',
    );
  });

  it('does not round up early', () => {
    expect(
      formatAge(new Date(2026, 0, 10).toISOString(), new Date(2026, 4, 9, 23, 59, 59, 999)),
    ).toBe('3 months old');
  });
});

describe('formatAge — year boundaries', () => {
  it('11m30d is months', () => {
    expect(formatAge(new Date(2026, 0, 10).toISOString(), new Date(2026, 11, 9))).toBe(
      '10 months old',
    );
  });

  it('exactly 12 months -> "1 yr old"', () => {
    expect(formatAge(new Date(2026, 0, 10).toISOString(), new Date(2027, 0, 10))).toBe(
      '1 yr old',
    );
  });

  it('13 months -> "1 yr 1 mo old"', () => {
    expect(formatAge(new Date(2026, 0, 10).toISOString(), new Date(2027, 1, 10))).toBe(
      '1 yr 1 mo old',
    );
  });

  it('boundary at 24 months', () => {
    expect(formatAge(new Date(2026, 0, 10).toISOString(), new Date(2028, 0, 9))).toBe(
      '1 yr 11 mo old',
    );
    expect(formatAge(new Date(2026, 0, 10).toISOString(), new Date(2028, 0, 10))).toBe(
      '2 yr old',
    );
  });

  it('long ages keep yr+mo format', () => {
    expect(formatAge(new Date(2024, 5, 15).toISOString(), new Date(2026, 7, 20))).toBe(
      '2 yr 2 mo old',
    );
  });
});

describe('wholeCalendarMonths month-end clamping', () => {
  it('Jan 31 -> Feb 28 counts as 1 month', () => {
    expect(wholeCalendarMonths(new Date(2027, 0, 31), new Date(2027, 1, 28))).toBe(1);
  });

  it('Jan 31 -> Feb 27 counts as 0 months', () => {
    expect(wholeCalendarMonths(new Date(2027, 0, 31), new Date(2027, 1, 27))).toBe(0);
  });
});
