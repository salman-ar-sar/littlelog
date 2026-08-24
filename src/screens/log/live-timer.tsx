import { useEffect, useState } from 'react';
import { Text } from 'react-native';

interface LiveTimerProps {
  /** Epoch ms when the currently-timed segment began. */
  sideStartedAt: number;
  /** Epoch ms the segment was paused at; null/undefined = still running. */
  pausedAt?: number | null;
  size?: 'md' | 'xl';
}

/**
 * Self-contained ticking stopwatch display. Isolated so parent screens
 * do not re-render on every tick.
 */
export function LiveTimer({ sideStartedAt, pausedAt = null, size = 'xl' }: LiveTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (pausedAt != null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [pausedAt]);

  const end = pausedAt ?? now;
  const seconds = Math.max(0, Math.round((end - sideStartedAt) / 1000));

  return (
    <Text
      className={`font-bold tabular-nums text-peach dark:text-[#F0A47E] ${
        size === 'xl' ? 'text-5xl' : 'text-xl'
      }`}
    >
      {formatClock(seconds)}
    </Text>
  );
}

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
