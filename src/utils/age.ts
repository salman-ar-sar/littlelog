/**
 * Natural age formatting, "What to Expect"-style:
 *   < 28 days    -> "3 days old" / "1 day old"
 *   28d – <70d   -> whole weeks ("6 weeks old")
 *   70d – <12mo  -> whole calendar months ("4 months old")
 *   12mo – <24mo -> "1 yr 2 mo old" ("1 yr old" when remainder is 0)
 *   >= 24mo      -> "3 yr 1 mo old"
 */
export function formatAge(dobISO: string, now: Date = new Date()): string {
  const dob = new Date(dobISO);
  let elapsedMs = now.getTime() - dob.getTime();
  if (elapsedMs < 0) elapsedMs = 0;

  const days = Math.floor(elapsedMs / 86_400_000);
  if (days < 28) {
    return plural(days, 'day') + ' old';
  }
  if (days < 70) {
    return plural(Math.floor(days / 7), 'week') + ' old';
  }

  const totalMonths = wholeCalendarMonths(dob, now);
  if (totalMonths < 12) {
    return plural(totalMonths, 'month') + ' old';
  }

  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  const yearPart = years === 1 ? '1 yr' : `${years} yr`;
  return remainingMonths > 0 ? `${yearPart} ${remainingMonths} mo old` : `${yearPart} old`;
}

function plural(n: number, unit: string): string {
  return n === 1 ? `1 ${unit}` : `${n} ${unit}s`;
}

/** Completed calendar months between two dates (e.g. Jan 31 -> Mar 1 = 1 month). */
export function wholeCalendarMonths(dob: Date, now: Date): number {
  let months =
    (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  // If the day-of-month hasn't been reached yet this month, a full month hasn't elapsed…
  // except when the birth day doesn't exist in the current month (e.g. Jan 31 -> Feb 28).
  const anchorDay = Math.min(dob.getDate(), daysInMonth(now.getFullYear(), now.getMonth()));
  if (now.getDate() < anchorDay) {
    months -= 1;
  }
  return Math.max(0, months);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Age without the "old" suffix — "6 weeks", "1 yr 2 mo". */
export function ageShort(dobISO: string, now: Date = new Date()): string {
  const full = formatAge(dobISO, now);
  return full.replace(/ old$/, '');
}

/** 1-based day of life — birth day is day 1. */
export function dayNumber(dobISO: string, now: Date = new Date()): number {
  const dob = new Date(dobISO);
  const start = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  return Math.max(1, Math.floor((startOfToday(now).getTime() - start.getTime()) / 86_400_000) + 1);
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
