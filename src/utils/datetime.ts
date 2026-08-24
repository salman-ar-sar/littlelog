/** Pure date/time display helpers (no RN imports — unit-testable). */

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today" | "Yesterday" | "Aug 24" | "Aug 24, 2025" when not the current year. */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const today = startOfLocalDay(now);
  const day = startOfLocalDay(date);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const label = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === now.getFullYear()
    ? label
    : `${label}, ${date.getFullYear()}`;
}

export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "just now", "15m ago", "2h ago", "3d ago". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function startOfLocalDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** ISO string of local midnight for a given date. */
export function localDayStartISO(date: Date = new Date()): string {
  return startOfLocalDay(date).toISOString();
}

/** "1h 24m", "45m", "30s". */
export function durationText(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) return `${minutes}m`;
  return `${secs}s`;
}
