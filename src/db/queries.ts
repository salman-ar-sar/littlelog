import { useEffect, useState } from 'react';
import { listBaths } from './baths';
import { listDiapers } from './diapers';
import { listDoses } from './doses';
import { listFeedings } from './feedings';
import { listMedicines } from './medicines';
import { listSleep } from './sleep';
import { listWeights } from './weights';
import type { BathEntry, DiaperEntry, FeedingEntry, SleepEntry, WeightEntry } from './types';
import { onDbChanged } from './change-bus';
import { durationText, formatTime } from '../utils/datetime';
import { formatVolumeMl, formatWeight } from '../utils/units';

/**
 * Reactive DB read keyed by `key`: runs `fn` on mount/key-change and
 * re-runs after every database write. `fn` must close over its inputs;
 * `key` must change whenever those inputs change.
 */
export function useDbQuery<T>(key: string, fn: () => Promise<T>): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const run = () =>
      fn()
        .then((result) => {
          if (alive) setData(result);
        })
        .catch((error) => {
          console.warn('[db] query failed:', error);
        });
    void run();
    const unsubscribe = onDbChanged(() => {
      void run();
    });
    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}

/* ------------------------------- Today snapshot ------------------------------ */

export type TodaySnapshot = {
  feeds: { count: number; totalMl: number; totalBreastSeconds: number };
  diapers: { wet: number; dirty: number; lastChangeAt: string | null };
  lastBathAt: string | null;
  lastFeedAt: string | null;
  lastWeightGrams: number | null;
  prevWeightGrams: number | null;
  sleepTodaySeconds: number;
  napCount: number;
  dosesGivenToday: number;
};

interface AllLists {
  feeds: FeedingEntry[];
  diapers: DiaperEntry[];
  baths: BathEntry[];
  weights: WeightEntry[];
  sleep: SleepEntry[];
  doses: MedicineDoseRow[];
}

async function fetchAll(babyId: string): Promise<AllLists> {
  const [feeds, diapers, baths, weights, sleep, doses] = await Promise.all([
    listFeedings(babyId),
    listDiapers(babyId),
    listBaths(babyId),
    listWeights(babyId),
    listSleep(babyId),
    listDoses(babyId),
  ]);
  return { feeds, diapers, baths, weights, sleep, doses };
}

function computeSnapshot(all: AllLists, now: Date): TodaySnapshot {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayEnd = dayStart + 86_400_000;
  const inDay = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= dayStart && t < dayEnd;
  };

  const feedsToday = all.feeds.filter((f) => inDay(f.timestamp));
  const totalMl = feedsToday.reduce((sum, f) => sum + (f.amountMl ?? 0), 0);
  const totalBreastSeconds = feedsToday.reduce(
    (sum, f) => sum + (f.mode === 'breast' ? (f.durationSeconds ?? 0) : 0),
    0,
  );

  const diapersToday = all.diapers.filter((d) => inDay(d.timestamp));
  const wet = diapersToday.filter((d) => d.wet).length;
  const dirty = diapersToday.filter((d) => d.dirty).length;
  const lastChange =
    diapersToday.length > 0
      ? diapersToday.reduce((a, b) => (a.timestamp > b.timestamp ? a : b)).timestamp
      : null;

  let sleepSeconds = 0;
  let napCount = 0;
  for (const s of all.sleep) {
    const start = new Date(s.startTime).getTime();
    const end = s.endTime ? new Date(s.endTime).getTime() : now.getTime();
    const overlap = Math.min(end, dayEnd) - Math.max(start, dayStart);
    if (overlap > 0 && end <= now.getTime()) sleepSeconds += Math.floor(overlap / 1000);
    if (s.type === 'nap' && inDay(s.startTime)) napCount += 1;
  }

  return {
    feeds: { count: feedsToday.length, totalMl, totalBreastSeconds },
    diapers: { wet, dirty, lastChangeAt: lastChange },
    lastBathAt: all.baths[0]?.timestamp ?? null,
    lastFeedAt: all.feeds[0]?.timestamp ?? null,
    lastWeightGrams: all.weights[0]?.weightGrams ?? null,
    prevWeightGrams: all.weights[1]?.weightGrams ?? null,
    sleepTodaySeconds: sleepSeconds,
    napCount,
    dosesGivenToday: all.doses.filter((x) => inDay(x.timestamp)).length,
  };
}

/** Snapshot recomputed on every db change; the "today" window is fixed at mount. */
export function useTodaySnapshot(babyId: string): TodaySnapshot | undefined {
  const [nowMs] = useState(() => Date.now());
  return useDbQuery(`today:${babyId}:${Math.floor(nowMs / 86_400_000)}`, async () =>
    computeSnapshot(await fetchAll(babyId), new Date(nowMs)),
  );
}

/* ---------------------------------- Timeline --------------------------------- */

export type TimelineKind = 'feed' | 'sleep' | 'diaper' | 'bath' | 'weight' | 'dose';

export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  /** Sortable instant (ISO). */
  at: string;
  title: string;
  subtitle: string;
}

const BOTTLE_TYPE_LABEL: Record<string, string> = {
  breast_milk: 'breast milk',
  formula: 'formula',
  mixed: 'mixed',
};

interface MedicineDoseRow {
  id: string;
  medicineId: string;
  timestamp: string;
  amount: number;
}

function buildTimeline(all: AllLists, medicines: { id: string; name: string }[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const f of all.feeds) {
    items.push({
      id: f.id,
      kind: 'feed',
      at: f.timestamp,
      title: 'Feed',
      subtitle:
        f.mode === 'bottle'
          ? `Bottle · ${formatVolumeMl(f.amountMl ?? 0, 'ml')}${
              f.bottleType ? ` · ${BOTTLE_TYPE_LABEL[f.bottleType]}` : ''
            }`
          : `Breast${f.side ? ` · ${f.side}` : ''}${
              f.durationSeconds ? ` · ${durationText(f.durationSeconds)}` : ''
            }`,
    });
  }
  for (const s of all.sleep) {
    const seconds = s.endTime
      ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)
      : null;
    items.push({
      id: s.id,
      kind: 'sleep',
      at: s.startTime,
      title: 'Sleep',
      subtitle:
        seconds !== null
          ? `${s.type === 'nap' ? 'Nap' : 'Night'} · ${durationText(seconds)}`
          : 'In progress',
    });
  }
  for (const d of all.diapers) {
    const kindLabel = d.wet && d.dirty ? 'Wet + dirty' : d.wet ? 'Wet' : 'Dirty';
    items.push({
      id: d.id,
      kind: 'diaper',
      at: d.timestamp,
      title: 'Diaper',
      subtitle: d.consistency ? `${kindLabel} · ${d.consistency}` : kindLabel,
    });
  }
  for (const b of all.baths) {
    items.push({
      id: b.id,
      kind: 'bath',
      at: b.timestamp,
      title: 'Bath',
      subtitle: b.note ?? formatTime(b.timestamp),
    });
  }
  for (const w of all.weights) {
    items.push({
      id: w.id,
      kind: 'weight',
      at: w.timestamp,
      title: 'Weight',
      subtitle: formatWeight(w.weightGrams, 'kg'),
    });
  }
  const nameById = new Map(medicines.map((m) => [m.id, m.name]));
  for (const dose of all.doses) {
    items.push({
      id: dose.id,
      kind: 'dose',
      at: dose.timestamp,
      title: 'Medicine',
      subtitle: `${nameById.get(dose.medicineId) ?? 'Medicine'} · ${dose.amount}`,
    });
  }
  return items.sort((a, b) => (a.at < b.at ? 1 : -1));
}

async function fetchTimelineWindow(babyId: string, fromMs: number): Promise<TimelineItem[]> {
  const [feeds, diapers, baths, weights, sleep, doses, medicines] = await Promise.all([
    listFeedings(babyId),
    listDiapers(babyId),
    listBaths(babyId),
    listWeights(babyId),
    listSleep(babyId),
    listDoses(babyId),
    listMedicines(babyId),
  ]);
  const inWindow = (iso: string) => new Date(iso).getTime() >= fromMs;
  return buildTimeline(
    {
      feeds: feeds.filter((f) => inWindow(f.timestamp)),
      diapers: diapers.filter((d) => inWindow(d.timestamp)),
      baths: baths.filter((b) => inWindow(b.timestamp)),
      weights: weights.filter((w) => inWindow(w.timestamp)),
      sleep: sleep.filter((s) => (s.endTime ? new Date(s.endTime).getTime() >= fromMs : true)),
      doses: doses.filter((x) => inWindow(x.timestamp)),
    },
    medicines,
  );
}

/** Reverse-chronological timeline of one local day. */
export function useTimelineDay(babyId: string, dayStartISO: string): TimelineItem[] | undefined {
  return useDbQuery(`day:${babyId}:${dayStartISO}`, () =>
    fetchTimelineWindow(babyId, new Date(dayStartISO).getTime()),
  );
}

/** Reverse-chronological timeline over the last `days` local days. */
export function useTimelineRange(babyId: string, days: number): TimelineItem[] | undefined {
  const [fromMs] = useState(() => Date.now() - days * 86_400_000);
  return useDbQuery(`range:${babyId}:${days}`, () => fetchTimelineWindow(babyId, fromMs));
}
