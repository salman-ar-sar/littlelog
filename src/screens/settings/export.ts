import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { listBabies } from '@/db/babies';
import { listBaths } from '@/db/baths';
import { listDiapers } from '@/db/diapers';
import { listDoses } from '@/db/doses';
import { listFeedings } from '@/db/feedings';
import { listMedicines } from '@/db/medicines';
import { listSleep } from '@/db/sleep';
import { listWeights } from '@/db/weights';
import type {
  Baby,
  BathEntry,
  DiaperEntry,
  FeedingEntry,
  Medicine,
  MedicineDoseEntry,
  SleepEntry,
  WeightEntry,
} from '@/db/types';
import { error as hapticError, success } from '@/utils/haptics';

interface AllData {
  exportedAt: string;
  babies: Baby[];
  weights: WeightEntry[];
  feedings: FeedingEntry[];
  sleep: SleepEntry[];
  diapers: DiaperEntry[];
  baths: BathEntry[];
  medicines: Medicine[];
  doses: MedicineDoseEntry[];
}

async function collectAll(): Promise<AllData> {
  const babies = await listBabies();
  const [weights, feedings, sleep, diapers, baths, medicines, doses] = await Promise.all([
    Promise.all(babies.map((b) => listWeights(b.id))),
    Promise.all(babies.map((b) => listFeedings(b.id))),
    Promise.all(babies.map((b) => listSleep(b.id))),
    Promise.all(babies.map((b) => listDiapers(b.id))),
    Promise.all(babies.map((b) => listBaths(b.id))),
    Promise.all(babies.map((b) => listMedicines(b.id))),
    Promise.all(babies.map((b) => listDoses(b.id))),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    babies,
    weights: weights.flat(),
    feedings: feedings.flat(),
    sleep: sleep.flat(),
    diapers: diapers.flat(),
    baths: baths.flat(),
    medicines: medicines.flat(),
    doses: doses.flat(),
  };
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    const strValue = String(value);
    return /[",\n]/.test(strValue) ? `"${strValue.replace(/"/g, '""')}"` : strValue;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

/** Export everything as JSON and share it. */
export async function exportJson(): Promise<void> {
  try {
    const data = await collectAll();
    const file = new File(Paths.cache, `littlelog-export-${Date.now()}.json`);
    file.create({ overwrite: true });
    file.write(JSON.stringify(data, null, 2));
    await share(file.uri);
    void success();
  } catch (e) {
    void hapticError();
    throw e;
  }
}

/** Export every entry table as one flat CSV and share it. */
export async function exportCsv(): Promise<void> {
  try {
    const data = await collectAll();
    const rows: Record<string, unknown>[] = [];
    for (const w of data.weights) rows.push({ type: 'weight', ...w });
    for (const f of data.feedings)
      rows.push({
        type: 'feeding',
        id: f.id,
        babyId: f.babyId,
        timestamp: f.timestamp,
        mode: f.mode,
        side: f.side,
        durationSeconds: f.durationSeconds,
        amountMl: f.amountMl,
        bottleType: f.bottleType,
        note: f.note,
      });
    for (const s of data.sleep)
      rows.push({
        type: 'sleep',
        id: s.id,
        babyId: s.babyId,
        startTime: s.startTime,
        endTime: s.endTime,
        sleepType: s.type,
        note: s.note,
      });
    for (const d of data.diapers)
      rows.push({
        type: 'diaper',
        id: d.id,
        babyId: d.babyId,
        timestamp: d.timestamp,
        wet: d.wet,
        dirty: d.dirty,
        consistency: d.consistency,
        note: d.note,
      });
    for (const b of data.baths) rows.push({ type: 'bath', ...b });
    for (const m of data.medicines)
      rows.push({
        type: 'medicine',
        ...m,
        reminderTimes: m.reminderTimes?.join(' ') ?? '',
      });
    for (const d of data.doses) rows.push({ type: 'dose', ...d });

    const file = new File(Paths.cache, `littlelog-export-${Date.now()}.csv`);
    file.create({ overwrite: true });
    file.write(toCsv(rows));
    await share(file.uri);
    void success();
  } catch (e) {
    void hapticError();
    throw e;
  }
}

async function share(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    console.warn('[export] sharing not available on this platform');
    return;
  }
  await Sharing.shareAsync(uri, {
    mimeType: uri.endsWith('.json') ? 'application/json' : 'text/csv',
    dialogTitle: 'LittleLog export',
  });
}
